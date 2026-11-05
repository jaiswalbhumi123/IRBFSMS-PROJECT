const pool = require('../config/db');

// 1. Naya Client Register karna (Company, Contact Person, Email, Phone, Business Requirements)
exports.createClient = async (req, res) => {
  try {
    const { company_name, contact_person, email, phone, business_requirements, status } = req.body;

    if (!company_name || !contact_person) {
      return res.status(400).json({ message: 'Company name and contact person are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO clients (company_name, contact_person, email, phone, business_requirements, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        company_name, 
        contact_person, 
        email || null, 
        phone || null, 
        business_requirements || null, 
        status || 'Active'
      ]
    );

    res.status(201).json({ message: 'Client registered successfully', id: result.insertId });
  } catch (err) {
    console.error('createClient error:', err);
    res.status(500).json({ message: 'Server error registering client' });
  }
};

// 2. Saare Clients ki list fetch karna
exports.getClients = async (req, res) => {
  try {
    const [clients] = await pool.query(`SELECT * FROM clients ORDER BY created_at DESC`);
    res.json(clients);
  } catch (err) {
    console.error('getClients error:', err);
    res.status(500).json({ message: 'Server error fetching clients' });
  }
};

// 3. Client ka status update karna (Active / Inactive)
exports.updateClientStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE clients SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Client status updated successfully' });
  } catch (err) {
    console.error('updateClientStatus error:', err);
    res.status(500).json({ message: 'Server error updating client status' });
  }
};

// 4. Client ke Documents Upload karna (Contract, Proposal, Agreement, Requirement)
exports.uploadClientDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Koi document file select nahi hui!' });
    }

    const clientId = req.params.id;
    const { document_type } = req.body;
    const file_path = `/uploads/${req.file.filename}`;
    const uploaded_by = req.user ? req.user.id : null;
    const docType = document_type || 'Client Contract / Proposal';

    const [result] = await pool.query(
      `INSERT INTO documents (reference_id, reference_type, document_type, file_path, uploaded_by, uploaded_at) 
       VALUES (?, 'Client', ?, ?, ?, NOW())`,
      [clientId, docType, file_path, uploaded_by]
    );

    res.status(201).json({
      message: 'Client document uploaded successfully',
      id: result.insertId,
      file_path
    });
  } catch (err) {
    console.error('uploadClientDocument error:', err);
    res.status(500).json({ message: 'Server error uploading client document' });
  }
};

// 5. Client ke Saare Documents Fetch karna
exports.getClientDocuments = async (req, res) => {
  try {
    const clientId = req.params.id;
    const [docs] = await pool.query(
      `SELECT d.*, u.name AS uploader_name 
       FROM documents d 
       LEFT JOIN users u ON d.uploaded_by = u.id 
       WHERE d.reference_type = 'Client' AND d.reference_id = ? 
       ORDER BY d.uploaded_at DESC`,
      [clientId]
    );
    res.json(docs);
  } catch (err) {
    console.error('getClientDocuments error:', err);
    res.status(500).json({ message: 'Server error fetching client documents' });
  }
};

// 4. Client ke Documents Upload karna (Contract, Proposal, Agreement, Requirement)
exports.uploadClientDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Koi document file select nahi hui!' });
    }

    const clientId = req.params.id;
    const { document_type } = req.body;
    const file_path = `/uploads/${req.file.filename}`;
    const uploaded_by = req.user ? req.user.id : null;
    const docType = document_type || 'Client Contract / Proposal';

    const [result] = await pool.query(
      `INSERT INTO documents (reference_id, reference_type, document_type, file_path, uploaded_by, uploaded_at) 
       VALUES (?, 'Client', ?, ?, ?, NOW())`,
      [clientId, docType, file_path, uploaded_by]
    );

    res.status(201).json({
      message: 'Client document uploaded successfully',
      id: result.insertId,
      file_path
    });
  } catch (err) {
    console.error('uploadClientDocument error:', err);
    res.status(500).json({ message: 'Server error uploading client document' });
  }
};

// 5. Client ke Saare Documents Fetch karna
exports.getClientDocuments = async (req, res) => {
  try {
    const clientId = req.params.id;
    const [docs] = await pool.query(
      `SELECT d.*, u.name AS uploader_name 
       FROM documents d 
       LEFT JOIN users u ON d.uploaded_by = u.id 
       WHERE d.reference_type = 'Client' AND d.reference_id = ? 
       ORDER BY d.uploaded_at DESC`,
      [clientId]
    );
    res.json(docs);
  } catch (err) {
    console.error('getClientDocuments error:', err);
    res.status(500).json({ message: 'Server error fetching client documents' });
  }
};

