const pool = require('../config/db');

// 1. Naya Lead Add karna (Title, Source, Service, Assigned Executive, Follow-up, Remarks)
exports.createLead = async (req, res) => {
  try {
    const { lead_title, source, service_required, assigned_to, follow_up_date, remarks } = req.body;

    if (!lead_title) {
      return res.status(400).json({ message: 'Lead title is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO leads (lead_title, source, service_required, assigned_to, status, follow_up_date, remarks) 
       VALUES (?, ?, ?, ?, 'Open', ?, ?)`,
      [
        lead_title, 
        source || 'Website', 
        service_required || null, 
        assigned_to || req.user.id, 
        follow_up_date || null, 
        remarks || null
      ]
    );

    res.status(201).json({ message: 'Lead added successfully', id: result.insertId });
  } catch (err) {
    console.error('createLead error:', err);
    res.status(500).json({ message: 'Server error adding lead' });
  }
};

// 2. Saare Leads fetch karna (Assigned Executive name ke sath)
exports.getLeads = async (req, res) => {
  try {
    const [leads] = await pool.query(`
      SELECT l.*, COALESCE(u.name, 'Rahul Verma') AS assigned_to_name 
      FROM leads l 
      LEFT JOIN users u ON l.assigned_to = u.id 
      ORDER BY l.created_at DESC
    `);
    res.json(leads);
  } catch (err) {
    console.error('getLeads error:', err);
    res.status(500).json({ message: 'Server error fetching leads' });
  }
};

// 3. Lead ka status update karna (Open, In Progress, Converted, Lost)
exports.updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE leads SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Lead status updated successfully' });
  } catch (err) {
    console.error('updateLeadStatus error:', err);
    res.status(500).json({ message: 'Server error updating lead status' });
  }
};

// 4. Next Follow-up Date & Remarks update karna
exports.updateFollowUp = async (req, res) => {
  try {
    const { follow_up_date, remarks } = req.body;
    await pool.query(
      'UPDATE leads SET follow_up_date = ?, remarks = COALESCE(?, remarks) WHERE id = ?',
      [follow_up_date, remarks, req.params.id]
    );
    res.json({ message: 'Follow-up updated successfully' });
  } catch (err) {
    console.error('updateFollowUp error:', err);
    res.status(500).json({ message: 'Server error updating follow-up' });
  }
};

// 5. CRM Dashboard ke 5 Exact Stats nikalna
exports.getCrmStats = async (req, res) => {
  try {
    const [[totalLeads]] = await pool.query('SELECT COUNT(*) as total FROM leads');
    const [[activeLeads]] = await pool.query("SELECT COUNT(*) as total FROM leads WHERE status IN ('Open', 'In Progress')");
    const [[convertedLeads]] = await pool.query("SELECT COUNT(*) as total FROM leads WHERE status = 'Converted'");
    const [[pendingFollowUps]] = await pool.query("SELECT COUNT(*) as total FROM leads WHERE follow_up_date <= CURDATE() AND status NOT IN ('Converted', 'Lost')");
    
    const [[totalClients]] = await pool.query('SELECT COUNT(*) as total FROM clients');
    const [[activeClients]] = await pool.query("SELECT COUNT(*) as total FROM clients WHERE status = 'Active'");

    res.json({
      totalLeads: totalLeads.total || 0,
      activeLeads: activeLeads.total || 0,
      convertedLeads: convertedLeads.total || 0,
      pendingFollowUps: pendingFollowUps.total || 0,
      totalClients: totalClients.total || 0,
      activeClients: activeClients.total || 0
    });
  } catch (err) {
    console.error('getCrmStats error:', err);
    res.status(500).json({ message: 'Server error fetching CRM stats' });
  }
};
