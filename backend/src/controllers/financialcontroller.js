const pool = require('../config/db');

// ================= 1. LOAN APPLICATIONS MANAGEMENT =================

// Nayi Loan Application Create Karna (Personal, Business, Vehicle, Other)
exports.createLoanApp = async (req, res) => {
  try {
    const { 
      applicant_name, 
      contact_details, 
      employment_type, 
      income_info, 
      loan_amount_requested, 
      purpose, 
      city, 
      loan_type, 
      required_documents,
      status 
    } = req.body;

    if (!applicant_name || !contact_details) {
      return res.status(400).json({ message: 'Applicant name and contact details are required.' });
    }

    const safeIncome = income_info ? parseFloat(income_info) : null;
    const safeAmount = loan_amount_requested ? parseFloat(loan_amount_requested) : 0;

    const [result] = await pool.query(
      `INSERT INTO loan_applications 
       (applicant_name, contact_details, employment_type, income_info, loan_amount_requested, purpose, city, loan_type, required_documents, status, application_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [
        applicant_name, 
        contact_details, 
        employment_type || 'Salaried', 
        safeIncome, 
        safeAmount, 
        purpose || null, 
        city || 'Pune', 
        loan_type || 'Personal Loan', 
        required_documents || null,
        status || 'New'
      ]
    );

    res.status(201).json({ message: 'Loan application created successfully', id: result.insertId });
  } catch (err) {
    console.error('createLoanApp error:', err);
    res.status(500).json({ message: 'Server error creating loan application' });
  }
};

// Saari Loan Applications List Karna (With search & status filter)
exports.getLoanApps = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM loan_applications WHERE 1=1';
    const params = [];

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (applicant_name LIKE ? OR contact_details LIKE ? OR city LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY created_at DESC';

    const [apps] = await pool.query(query, params);
    res.json(apps);
  } catch (err) {
    console.error('getLoanApps error:', err);
    res.status(500).json({ message: 'Server error fetching loan applications' });
  }
};

// Single Loan Application By ID
exports.getLoanAppById = async (req, res) => {
  try {
    const [apps] = await pool.query('SELECT * FROM loan_applications WHERE id = ?', [req.params.id]);
    if (apps.length === 0) {
      return res.status(404).json({ message: 'Loan application not found' });
    }
    res.json(apps[0]);
  } catch (err) {
    console.error('getLoanAppById error:', err);
    res.status(500).json({ message: 'Server error fetching loan application' });
  }
};

// Loan Status Update Karna (New -> Documents Pending -> Submitted -> Under Process -> Approved -> Rejected -> Closed)
exports.updateLoanStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    await pool.query('UPDATE loan_applications SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Loan application status updated successfully' });
  } catch (err) {
    console.error('updateLoanStatus error:', err);
    res.status(500).json({ message: 'Server error updating loan status' });
  }
};


// ================= 2. CREDIT CARD APPLICATIONS MANAGEMENT =================

// Nayi Credit Card Application Create Karna
exports.createCreditCardApp = async (req, res) => {
  try {
    const { 
      applicant_name, 
      mobile_number, 
      email, 
      employment_type, 
      monthly_income, 
      city, 
      required_product, 
      required_documents,
      status 
    } = req.body;

    if (!applicant_name || !mobile_number) {
      return res.status(400).json({ message: 'Applicant name and mobile number are required.' });
    }

    const safeIncome = monthly_income ? parseFloat(monthly_income) : null;

    const [result] = await pool.query(
      `INSERT INTO credit_card_applications 
       (applicant_name, mobile_number, email, employment_type, monthly_income, city, required_product, required_documents, status, application_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [
        applicant_name, 
        mobile_number, 
        email || null, 
        employment_type || 'Salaried', 
        safeIncome, 
        city || 'Pune', 
        required_product || 'Platinum Card', 
        required_documents || null,
        status || 'New'
      ]
    );

    res.status(201).json({ message: 'Credit card application created successfully', id: result.insertId });
  } catch (err) {
    console.error('createCreditCardApp error:', err);
    res.status(500).json({ message: 'Server error creating credit card application' });
  }
};

// Saari Credit Card Applications List Karna
exports.getCreditCardApps = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM credit_card_applications WHERE 1=1';
    const params = [];

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (applicant_name LIKE ? OR mobile_number LIKE ? OR city LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY created_at DESC';

    const [apps] = await pool.query(query, params);
    res.json(apps);
  } catch (err) {
    console.error('getCreditCardApps error:', err);
    res.status(500).json({ message: 'Server error fetching credit card applications' });
  }
};

// Single Credit Card Application By ID
exports.getCreditCardAppById = async (req, res) => {
  try {
    const [apps] = await pool.query('SELECT * FROM credit_card_applications WHERE id = ?', [req.params.id]);
    if (apps.length === 0) {
      return res.status(404).json({ message: 'Credit card application not found' });
    }
    res.json(apps[0]);
  } catch (err) {
    console.error('getCreditCardAppById error:', err);
    res.status(500).json({ message: 'Server error fetching credit card application' });
  }
};

// Credit Card Status Update Karna
exports.updateCreditCardStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    await pool.query('UPDATE credit_card_applications SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Credit card application status updated successfully' });
  } catch (err) {
    console.error('updateCreditCardStatus error:', err);
    res.status(500).json({ message: 'Server error updating credit card status' });
  }
};


// ================= 3. FINANCIAL DASHBOARD 5 CASE STUDY METRICS =================
exports.getFinancialStats = async (req, res) => {
  try {
    const [[loans]] = await pool.query('SELECT COUNT(*) as total FROM loan_applications');
    const [[cards]] = await pool.query('SELECT COUNT(*) as total FROM credit_card_applications');
    const [[pendingLoanDocs]] = await pool.query("SELECT COUNT(*) as total FROM loan_applications WHERE status = 'Documents Pending'");
    const [[pendingCardDocs]] = await pool.query("SELECT COUNT(*) as total FROM credit_card_applications WHERE status = 'Documents Pending'");
    const [[approvedLoans]] = await pool.query("SELECT COUNT(*) as total FROM loan_applications WHERE status = 'Approved'");
    const [[approvedCards]] = await pool.query("SELECT COUNT(*) as total FROM credit_card_applications WHERE status = 'Approved'");
    const [[underProcessLoans]] = await pool.query("SELECT COUNT(*) as total FROM loan_applications WHERE status IN ('Under Process', 'Submitted')");
    const [[underProcessCards]] = await pool.query("SELECT COUNT(*) as total FROM credit_card_applications WHERE status IN ('Under Process', 'Submitted')");

    const totalLoans = loans?.total || 0;
    const totalCards = cards?.total || 0;
    const docsPending = (pendingLoanDocs?.total || 0) + (pendingCardDocs?.total || 0);
    const approved = (approvedLoans?.total || 0) + (approvedCards?.total || 0);
    const underProcess = (underProcessLoans?.total || 0) + (underProcessCards?.total || 0);
    const totalEnquiries = totalLoans + totalCards;

    // Loan types breakdown for distribution chart
    const [loanTypeRows] = await pool.query(`
      SELECT COALESCE(NULLIF(loan_type, ''), 'Personal Loan') as name, COUNT(*) as value 
      FROM loan_applications 
      GROUP BY loan_type
    `);

    const funnelData = [
      { name: 'Total Inquiries', value: totalEnquiries },
      { name: 'Under Process', value: underProcess },
      { name: 'Docs Pending', value: docsPending },
      { name: 'Approved', value: approved }
    ];

    const productData = [
      ...(loanTypeRows.length > 0 ? loanTypeRows : [{ name: 'Personal Loans', value: totalLoans || 1 }]),
      { name: 'Credit Cards', value: totalCards || 0 }
    ];

    const kpi = {
      totalEnquiries,
      totalLoans,
      totalCards,
      docsPending,
      approved,
      underProcess
    };

    res.json({
      // Flat properties for existing compatibility
      ...kpi,
      // Enhanced chart and nested data
      kpi,
      funnelData,
      productData
    });
  } catch (err) {
    console.error('getFinancialStats error:', err);
    res.status(500).json({ message: 'Server error fetching financial stats' });
  }
};

// ================= 4. FINANCIAL KYC & DOCUMENT MANAGEMENT =================

// Document Upload API for Loans & Credit Cards
exports.uploadDocument = async (req, res) => {
  try {
    const { reference_id, reference_type, document_type, update_status } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Koi file upload nahi hui!' });
    }

    if (!reference_id || !reference_type) {
      return res.status(400).json({ message: 'reference_id aur reference_type required hain.' });
    }

    const file_path = `/uploads/${req.file.filename}`;
    const uploaded_by = req.user ? req.user.id : null;
    const docType = document_type || 'KYC Document';

    const [result] = await pool.query(
      `INSERT INTO documents (reference_id, reference_type, document_type, file_path, uploaded_by, uploaded_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [reference_id, reference_type, docType, file_path, uploaded_by]
    );

    // Agar application status update karna ho (e.g. from Documents Pending to Submitted)
    if (update_status) {
      if (reference_type === 'Loan') {
        await pool.query('UPDATE loan_applications SET status = ? WHERE id = ?', [update_status, reference_id]);
      } else if (reference_type === 'CreditCard') {
        await pool.query('UPDATE credit_card_applications SET status = ? WHERE id = ?', [update_status, reference_id]);
      }
    }
    
    res.status(201).json({ 
      message: 'KYC Document uploaded successfully', 
      id: result.insertId, 
      file_path: file_path 
    });
  } catch (err) {
    console.error('uploadDocument error:', err);
    res.status(500).json({ message: 'Server error uploading KYC document' });
  }
};

// Get All Financial KYC Documents
exports.getFinancialDocuments = async (req, res) => {
  try {
    const query = `
      SELECT d.*, 
             u.name AS uploader_name,
             CASE 
               WHEN d.reference_type = 'Loan' THEN la.applicant_name
               WHEN d.reference_type = 'CreditCard' THEN ca.applicant_name
               ELSE 'N/A'
             END AS applicant_name,
             CASE 
               WHEN d.reference_type = 'Loan' THEN la.status
               WHEN d.reference_type = 'CreditCard' THEN ca.status
               ELSE 'N/A'
             END AS app_status
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN loan_applications la ON d.reference_type = 'Loan' AND d.reference_id = la.id
      LEFT JOIN credit_card_applications ca ON d.reference_type = 'CreditCard' AND d.reference_id = ca.id
      WHERE d.reference_type IN ('Loan', 'CreditCard')
      ORDER BY d.uploaded_at DESC
    `;
    const [docs] = await pool.query(query);
    res.json(docs);
  } catch (err) {
    console.error('getFinancialDocuments error:', err);
    res.status(500).json({ message: 'Server error fetching financial documents' });
  }
};
