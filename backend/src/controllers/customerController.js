const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Auto-ensure customers table & foreign linkage columns exist
let tablesReady = false;
async function ensureCustomerTables() {
  if (tablesReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        city VARCHAR(100),
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await pool.query('ALTER TABLE loan_applications ADD COLUMN customer_id INT NULL');
    } catch (e) { /* Column already exists */ }

    try {
      await pool.query('ALTER TABLE credit_card_applications ADD COLUMN customer_id INT NULL');
    } catch (e) { /* Column already exists */ }

    tablesReady = true;
  } catch (err) {
    console.error('ensureCustomerTables error:', err.message);
  }
}
ensureCustomerTables();

// 1. Customer Registration
exports.register = async (req, res) => {
  try {
    await ensureCustomerTables();
    const { name, email, password, phone, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Check if email already registered
    const [existing] = await pool.query('SELECT id FROM customers WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email is already registered. Please login.' });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Save to customers table
    const [result] = await pool.query(
      'INSERT INTO customers (name, email, password_hash, phone, city, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), password_hash, phone ? phone.trim() : null, city ? city.trim() : null, 'Active']
    );

    res.status(201).json({
      message: 'Registration successful! You can now log in.',
      customerId: result.insertId
    });
  } catch (err) {
    console.error('Customer register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// 2. Customer Login
exports.login = async (req, res) => {
  try {
    await ensureCustomerTables();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [customers] = await pool.query('SELECT * FROM customers WHERE email = ?', [email.trim().toLowerCase()]);
    if (customers.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const customer = customers[0];

    if (customer.status === 'Inactive') {
      return res.status(403).json({ message: 'Your account is currently inactive. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, customer.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Sign JWT token with customer info
    const token = jwt.sign(
      {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        role: 'Customer'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
        role: 'Customer'
      }
    });
  } catch (err) {
    console.error('Customer login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// 3. Apply for Loan (Protected)
exports.applyLoan = async (req, res) => {
  try {
    await ensureCustomerTables();
    const customerId = req.user.id;

    // Fetch customer details if some fields omitted
    const [custRows] = await pool.query('SELECT name, phone, city, email FROM customers WHERE id = ?', [customerId]);
    const cust = custRows[0] || {};

    const applicant_name = req.body.applicant_name || cust.name || 'Valued Customer';
    const contact_details = req.body.contact_details || req.body.phone || cust.phone || cust.email || '';
    const loan_type = req.body.loan_type || 'Personal Loan';
    const loan_amount_requested = parseFloat(req.body.loan_amount_requested || req.body.amount || 0);
    const income_info = req.body.income_info || req.body.monthly_income || null;
    const city = req.body.city || cust.city || 'Pune';
    const purpose = req.body.purpose || 'Personal / Business Needs';
    const employment_type = req.body.employment_type || 'Salaried';

    // File uploaded via Multer or passed as string
    let required_documents = req.body.required_documents || null;
    if (req.file) {
      required_documents = `/uploads/${req.file.filename}`;
    }

    const [result] = await pool.query(
      `INSERT INTO loan_applications 
       (applicant_name, contact_details, employment_type, income_info, loan_amount_requested, purpose, city, loan_type, required_documents, status, customer_id, application_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, CURDATE())`,
      [
        applicant_name,
        contact_details,
        employment_type,
        income_info,
        loan_amount_requested,
        purpose,
        city,
        loan_type,
        required_documents,
        customerId
      ]
    );

    const applicationId = `LOAN-${result.insertId}`;

    // Also link into documents table if file uploaded
    if (req.file) {
      try {
        await pool.query(
          `INSERT INTO documents (reference_id, reference_type, document_type, file_path, uploaded_by, uploaded_at)
           VALUES (?, 'Loan', 'Customer KYC/Income Proof', ?, ?, NOW())`,
          [result.insertId, required_documents, customerId]
        );
      } catch (docErr) {
        console.warn('Document linkage error:', docErr.message);
      }
    }

    res.status(201).json({
      message: 'Loan application submitted successfully!',
      applicationId,
      id: result.insertId,
      status: 'New'
    });
  } catch (err) {
    console.error('applyLoan error:', err);
    res.status(500).json({ message: 'Failed to submit loan application' });
  }
};

// 4. Apply for Credit Card (Protected)
exports.applyCreditCard = async (req, res) => {
  try {
    await ensureCustomerTables();
    const customerId = req.user.id;

    const [custRows] = await pool.query('SELECT name, phone, city, email FROM customers WHERE id = ?', [customerId]);
    const cust = custRows[0] || {};

    const applicant_name = req.body.applicant_name || cust.name || 'Valued Customer';
    const mobile_number = req.body.mobile_number || req.body.phone || cust.phone || '';
    const email = req.body.email || cust.email || '';
    const employment_type = req.body.employment_type || 'Salaried';
    const monthly_income = parseFloat(req.body.monthly_income || req.body.income_info || 0);
    const city = req.body.city || cust.city || 'Pune';
    const required_product = req.body.required_product || req.body.card_type || 'Platinum Rewards Card';

    let required_documents = req.body.required_documents || null;
    if (req.file) {
      required_documents = `/uploads/${req.file.filename}`;
    }

    const [result] = await pool.query(
      `INSERT INTO credit_card_applications 
       (applicant_name, mobile_number, email, employment_type, monthly_income, city, required_product, required_documents, status, customer_id, application_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, CURDATE())`,
      [
        applicant_name,
        mobile_number,
        email,
        employment_type,
        monthly_income,
        city,
        required_product,
        required_documents,
        customerId
      ]
    );

    const applicationId = `CARD-${result.insertId}`;

    if (req.file) {
      try {
        await pool.query(
          `INSERT INTO documents (reference_id, reference_type, document_type, file_path, uploaded_by, uploaded_at)
           VALUES (?, 'CreditCard', 'Customer Card Verification Document', ?, ?, NOW())`,
          [result.insertId, required_documents, customerId]
        );
      } catch (docErr) {
        console.warn('Document linkage error:', docErr.message);
      }
    }

    res.status(201).json({
      message: 'Credit card application submitted successfully!',
      applicationId,
      id: result.insertId,
      status: 'New'
    });
  } catch (err) {
    console.error('applyCreditCard error:', err);
    res.status(500).json({ message: 'Failed to submit credit card application' });
  }
};

// 5. Get My Applications (Protected)
exports.getMyApplications = async (req, res) => {
  try {
    await ensureCustomerTables();
    const customerId = req.user.id;

    // Get customer profile to match by customer_id or phone or email
    const [custRows] = await pool.query('SELECT email, phone FROM customers WHERE id = ?', [customerId]);
    const custEmail = custRows[0]?.email || req.user.email || '';
    const custPhone = custRows[0]?.phone || '';

    // Loans
    const [loans] = await pool.query(
      `SELECT 
         id, 
         CONCAT('LOAN-', id) AS applicationId, 
         'Loan' AS type, 
         COALESCE(loan_type, 'Personal Loan') AS productTitle,
         loan_amount_requested AS amount, 
         applicant_name,
         contact_details,
         city,
         status, 
         required_documents, 
         application_date, 
         created_at 
       FROM loan_applications 
       WHERE customer_id = ? OR (contact_details IS NOT NULL AND contact_details != '' AND contact_details = ?)
       ORDER BY id DESC`,
      [customerId, custPhone]
    );

    // Cards
    const [cards] = await pool.query(
      `SELECT 
         id, 
         CONCAT('CARD-', id) AS applicationId, 
         'Credit Card' AS type, 
         COALESCE(required_product, 'Platinum Card') AS productTitle,
         monthly_income AS amount, 
         applicant_name,
         mobile_number AS contact_details,
         city,
         status, 
         required_documents, 
         application_date, 
         created_at 
       FROM credit_card_applications 
       WHERE customer_id = ? OR (email IS NOT NULL AND email != '' AND email = ?) OR (mobile_number IS NOT NULL AND mobile_number != '' AND mobile_number = ?)
       ORDER BY id DESC`,
      [customerId, custEmail, custPhone]
    );

    const combined = [...loans, ...cards].sort((a, b) => {
      const dateA = new Date(a.application_date || a.created_at || 0);
      const dateB = new Date(b.application_date || b.created_at || 0);
      return dateB - dateA;
    });

    const stats = {
      total: combined.length,
      approved: combined.filter(app => (app.status || '').toLowerCase() === 'approved').length,
      pending: combined.filter(app => ['new', 'documents pending', 'submitted', 'under process'].includes((app.status || '').toLowerCase())).length,
      rejected: combined.filter(app => ['rejected', 'closed'].includes((app.status || '').toLowerCase())).length
    };

    res.json({
      applications: combined,
      stats
    });
  } catch (err) {
    console.error('getMyApplications error:', err);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
};

// 6. Track Application (Public - No Login Required)
exports.trackApplication = async (req, res) => {
  try {
    await ensureCustomerTables();
    const queryId = (req.params.id || '').trim();

    if (!queryId) {
      return res.status(400).json({ message: 'Please provide a valid Application ID' });
    }

    const upper = queryId.toUpperCase();
    const isLoanSearch = upper.startsWith('LOAN-');
    const isCardSearch = upper.startsWith('CARD-') || upper.startsWith('CC-');
    let numericId = parseInt(upper.replace(/^(LOAN-|CARD-|CC-)/, ''), 10);

    if (isNaN(numericId)) {
      numericId = parseInt(queryId, 10);
    }

    if (!numericId || isNaN(numericId)) {
      return res.status(400).json({ message: 'Invalid Application ID format. Example: LOAN-101 or CARD-102' });
    }

    let foundApp = null;

    if (isLoanSearch) {
      const [rows] = await pool.query('SELECT * FROM loan_applications WHERE id = ?', [numericId]);
      if (rows.length > 0) {
        const item = rows[0];
        foundApp = {
          applicationId: `LOAN-${item.id}`,
          type: 'Loan',
          productTitle: item.loan_type || 'Personal Loan',
          applicant_name: item.applicant_name,
          contact_details: item.contact_details,
          amount: item.loan_amount_requested,
          city: item.city,
          purpose: item.purpose,
          employment_type: item.employment_type,
          status: item.status || 'New',
          documents: item.required_documents,
          application_date: item.application_date || item.created_at,
          created_at: item.created_at
        };
      }
    } else if (isCardSearch) {
      const [rows] = await pool.query('SELECT * FROM credit_card_applications WHERE id = ?', [numericId]);
      if (rows.length > 0) {
        const item = rows[0];
        foundApp = {
          applicationId: `CARD-${item.id}`,
          type: 'Credit Card',
          productTitle: item.required_product || 'Platinum Card',
          applicant_name: item.applicant_name,
          contact_details: item.mobile_number,
          amount: item.monthly_income,
          city: item.city,
          employment_type: item.employment_type,
          status: item.status || 'New',
          documents: item.required_documents,
          application_date: item.application_date || item.created_at,
          created_at: item.created_at
        };
      }
    } else {
      const [loans] = await pool.query('SELECT * FROM loan_applications WHERE id = ?', [numericId]);
      if (loans.length > 0) {
        const item = loans[0];
        foundApp = {
          applicationId: `LOAN-${item.id}`,
          type: 'Loan',
          productTitle: item.loan_type || 'Personal Loan',
          applicant_name: item.applicant_name,
          contact_details: item.contact_details,
          amount: item.loan_amount_requested,
          city: item.city,
          purpose: item.purpose,
          employment_type: item.employment_type,
          status: item.status || 'New',
          documents: item.required_documents,
          application_date: item.application_date || item.created_at,
          created_at: item.created_at
        };
      } else {
        const [cards] = await pool.query('SELECT * FROM credit_card_applications WHERE id = ?', [numericId]);
        if (cards.length > 0) {
          const item = cards[0];
          foundApp = {
            applicationId: `CARD-${item.id}`,
            type: 'Credit Card',
            productTitle: item.required_product || 'Platinum Card',
            applicant_name: item.applicant_name,
            contact_details: item.mobile_number,
            amount: item.monthly_income,
            city: item.city,
            employment_type: item.employment_type,
            status: item.status || 'New',
            documents: item.required_documents,
            application_date: item.application_date || item.created_at,
            created_at: item.created_at
          };
        }
      }
    }

    if (!foundApp) {
      return res.status(404).json({ message: `No application found with ID "${queryId}". Please verify and try again.` });
    }

    res.json(foundApp);
  } catch (err) {
    console.error('trackApplication error:', err);
    res.status(500).json({ message: 'Server error while tracking application' });
  }
};


// 3. Apply for Loan (Protected)
exports.applyLoan = async (req, res) => {
  try {
    await ensureCustomerTables();
    const customerId = req.user.id;

    // Fetch customer details if some fields omitted
    const [custRows] = await pool.query('SELECT name, phone, city, email FROM customers WHERE id = ?', [customerId]);
    const cust = custRows[0] || {};

    const applicant_name = req.body.applicant_name || cust.name || 'Valued Customer';
    const contact_details = req.body.contact_details || req.body.phone || cust.phone || cust.email || '';
    const loan_type = req.body.loan_type || 'Personal Loan';
    const loan_amount_requested = parseFloat(req.body.loan_amount_requested || req.body.amount || 0);
    const income_info = req.body.income_info || req.body.monthly_income || null;
    const city = req.body.city || cust.city || 'Pune';
    const purpose = req.body.purpose || 'Personal / Business Needs';
    const employment_type = req.body.employment_type || 'Salaried';

    // File uploaded via Multer or passed as string
    let required_documents = req.body.required_documents || null;
    if (req.file) {
      required_documents = `/uploads/${req.file.filename}`;
    }

    const [result] = await pool.query(
      `INSERT INTO loan_applications 
       (applicant_name, contact_details, employment_type, income_info, loan_amount_requested, purpose, city, loan_type, required_documents, status, customer_id, application_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, CURDATE())`,
      [
        applicant_name,
        contact_details,
        employment_type,
        income_info,
        loan_amount_requested,
        purpose,
        city,
        loan_type,
        required_documents,
        customerId
      ]
    );

    const applicationId = `LOAN-${result.insertId}`;

    // Also link into documents table if file uploaded
    if (req.file) {
      try {
        await pool.query(
          `INSERT INTO documents (reference_id, reference_type, document_type, file_path, uploaded_by, uploaded_at)
           VALUES (?, 'Loan', 'Customer KYC/Income Proof', ?, ?, NOW())`,
          [result.insertId, required_documents, customerId]
        );
      } catch (docErr) {
        console.warn('Document linkage error:', docErr.message);
      }
    }

    res.status(201).json({
      message: 'Loan application submitted successfully!',
      applicationId,
      id: result.insertId,
      status: 'New'
    });
  } catch (err) {
    console.error('applyLoan error:', err);
    res.status(500).json({ message: 'Failed to submit loan application' });
  }
};

// 4. Apply for Credit Card (Protected)
exports.applyCreditCard = async (req, res) => {
  try {
    await ensureCustomerTables();
    const customerId = req.user.id;

    const [custRows] = await pool.query('SELECT name, phone, city, email FROM customers WHERE id = ?', [customerId]);
    const cust = custRows[0] || {};

    const applicant_name = req.body.applicant_name || cust.name || 'Valued Customer';
    const mobile_number = req.body.mobile_number || req.body.phone || cust.phone || '';
    const email = req.body.email || cust.email || '';
    const employment_type = req.body.employment_type || 'Salaried';
    const monthly_income = parseFloat(req.body.monthly_income || req.body.income_info || 0);
    const city = req.body.city || cust.city || 'Pune';
    const required_product = req.body.required_product || req.body.card_type || 'Platinum Rewards Card';

    let required_documents = req.body.required_documents || null;
    if (req.file) {
      required_documents = `/uploads/${req.file.filename}`;
    }

    const [result] = await pool.query(
      `INSERT INTO credit_card_applications 
       (applicant_name, mobile_number, email, employment_type, monthly_income, city, required_product, required_documents, status, customer_id, application_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, CURDATE())`,
      [
        applicant_name,
        mobile_number,
        email,
        employment_type,
        monthly_income,
        city,
        required_product,
        required_documents,
        customerId
      ]
    );

    const applicationId = `CARD-${result.insertId}`;

    if (req.file) {
      try {
        await pool.query(
          `INSERT INTO documents (reference_id, reference_type, document_type, file_path, uploaded_by, uploaded_at)
           VALUES (?, 'CreditCard', 'Customer Card Verification Document', ?, ?, NOW())`,
          [result.insertId, required_documents, customerId]
        );
      } catch (docErr) {
        console.warn('Document linkage error:', docErr.message);
      }
    }

    res.status(201).json({
      message: 'Credit card application submitted successfully!',
      applicationId,
      id: result.insertId,
      status: 'New'
    });
  } catch (err) {
    console.error('applyCreditCard error:', err);
    res.status(500).json({ message: 'Failed to submit credit card application' });
  }
};

// 5. Get My Applications (Protected)
exports.getMyApplications = async (req, res) => {
  try {
    await ensureCustomerTables();
    const customerId = req.user.id;

    // Get customer profile to match by customer_id or phone or email
    const [custRows] = await pool.query('SELECT email, phone FROM customers WHERE id = ?', [customerId]);
    const custEmail = custRows[0]?.email || req.user.email || '';
    const custPhone = custRows[0]?.phone || '';

    // Loans
    const [loans] = await pool.query(
      `SELECT 
         id, 
         CONCAT('LOAN-', id) AS applicationId, 
         'Loan' AS type, 
         COALESCE(loan_type, 'Personal Loan') AS productTitle,
         loan_amount_requested AS amount, 
         applicant_name,
         contact_details,
         city,
         status, 
         required_documents, 
         application_date, 
         created_at 
       FROM loan_applications 
       WHERE customer_id = ? OR (contact_details IS NOT NULL AND contact_details != '' AND contact_details = ?)
       ORDER BY id DESC`,
      [customerId, custPhone]
    );

    // Cards
    const [cards] = await pool.query(
      `SELECT 
         id, 
         CONCAT('CARD-', id) AS applicationId, 
         'Credit Card' AS type, 
         COALESCE(required_product, 'Platinum Card') AS productTitle,
         monthly_income AS amount, 
         applicant_name,
         mobile_number AS contact_details,
         city,
         status, 
         required_documents, 
         application_date, 
         created_at 
       FROM credit_card_applications 
       WHERE customer_id = ? OR (email IS NOT NULL AND email != '' AND email = ?) OR (mobile_number IS NOT NULL AND mobile_number != '' AND mobile_number = ?)
       ORDER BY id DESC`,
      [customerId, custEmail, custPhone]
    );

    const combined = [...loans, ...cards].sort((a, b) => {
      const dateA = new Date(a.application_date || a.created_at || 0);
      const dateB = new Date(b.application_date || b.created_at || 0);
      return dateB - dateA;
    });

    const stats = {
      total: combined.length,
      approved: combined.filter(app => (app.status || '').toLowerCase() === 'approved').length,
      pending: combined.filter(app => ['new', 'documents pending', 'submitted', 'under process'].includes((app.status || '').toLowerCase())).length,
      rejected: combined.filter(app => ['rejected', 'closed'].includes((app.status || '').toLowerCase())).length
    };

    res.json({
      applications: combined,
      stats
    });
  } catch (err) {
    console.error('getMyApplications error:', err);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
};

// 6. Track Application (Public - No Login Required)
exports.trackApplication = async (req, res) => {
  try {
    await ensureCustomerTables();
    const queryId = (req.params.id || '').trim();

    if (!queryId) {
      return res.status(400).json({ message: 'Please provide a valid Application ID' });
    }

    const upper = queryId.toUpperCase();
    const isLoanSearch = upper.startsWith('LOAN-');
    const isCardSearch = upper.startsWith('CARD-') || upper.startsWith('CC-');
    let numericId = parseInt(upper.replace(/^(LOAN-|CARD-|CC-)/, ''), 10);

    if (isNaN(numericId)) {
      numericId = parseInt(queryId, 10);
    }

    if (!numericId || isNaN(numericId)) {
      return res.status(400).json({ message: 'Invalid Application ID format. Example: LOAN-101 or CARD-102' });
    }

    let foundApp = null;

    if (isLoanSearch) {
      const [rows] = await pool.query('SELECT * FROM loan_applications WHERE id = ?', [numericId]);
      if (rows.length > 0) {
        const item = rows[0];
        foundApp = {
          applicationId: `LOAN-${item.id}`,
          type: 'Loan',
          productTitle: item.loan_type || 'Personal Loan',
          applicant_name: item.applicant_name,
          contact_details: item.contact_details,
          amount: item.loan_amount_requested,
          city: item.city,
          purpose: item.purpose,
          employment_type: item.employment_type,
          status: item.status || 'New',
          documents: item.required_documents,
          application_date: item.application_date || item.created_at,
          created_at: item.created_at
        };
      }
    } else if (isCardSearch) {
      const [rows] = await pool.query('SELECT * FROM credit_card_applications WHERE id = ?', [numericId]);
      if (rows.length > 0) {
        const item = rows[0];
        foundApp = {
          applicationId: `CARD-${item.id}`,
          type: 'Credit Card',
          productTitle: item.required_product || 'Platinum Card',
          applicant_name: item.applicant_name,
          contact_details: item.mobile_number,
          amount: item.monthly_income,
          city: item.city,
          employment_type: item.employment_type,
          status: item.status || 'New',
          documents: item.required_documents,
          application_date: item.application_date || item.created_at,
          created_at: item.created_at
        };
      }
    } else {
      const [loans] = await pool.query('SELECT * FROM loan_applications WHERE id = ?', [numericId]);
      if (loans.length > 0) {
        const item = loans[0];
        foundApp = {
          applicationId: `LOAN-${item.id}`,
          type: 'Loan',
          productTitle: item.loan_type || 'Personal Loan',
          applicant_name: item.applicant_name,
          contact_details: item.contact_details,
          amount: item.loan_amount_requested,
          city: item.city,
          purpose: item.purpose,
          employment_type: item.employment_type,
          status: item.status || 'New',
          documents: item.required_documents,
          application_date: item.application_date || item.created_at,
          created_at: item.created_at
        };
      } else {
        const [cards] = await pool.query('SELECT * FROM credit_card_applications WHERE id = ?', [numericId]);
        if (cards.length > 0) {
          const item = cards[0];
          foundApp = {
            applicationId: `CARD-${item.id}`,
            type: 'Credit Card',
            productTitle: item.required_product || 'Platinum Card',
            applicant_name: item.applicant_name,
            contact_details: item.mobile_number,
            amount: item.monthly_income,
            city: item.city,
            employment_type: item.employment_type,
            status: item.status || 'New',
            documents: item.required_documents,
            application_date: item.application_date || item.created_at,
            created_at: item.created_at
          };
        }
      }
    }

    if (!foundApp) {
      return res.status(404).json({ message: `No application found with ID "${queryId}". Please verify and try again.` });
    }

    res.json(foundApp);
  } catch (err) {
    console.error('trackApplication error:', err);
    res.status(500).json({ message: 'Server error while tracking application' });
  }
};