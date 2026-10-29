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
