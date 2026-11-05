const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

// 1. Generic & Multi-Module Document Upload
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Koi file select nahi ki gayi hai!' });
    }

    const { reference_id, reference_type, document_type, update_status } = req.body;

    if (!reference_id || !reference_type) {
      return res.status(400).json({ message: 'reference_id aur reference_type zaroori hain' });
    }

    // Web accessible relative path
    const file_path = `/uploads/${req.file.filename}`;
    const uploaded_by = req.user ? req.user.id : null;
    const docType = document_type || 'General Document';

    // Insert record in documents table
    const [result] = await pool.query(
      `INSERT INTO documents (reference_id, reference_type, document_type, file_path, uploaded_by, uploaded_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [reference_id, reference_type, docType, file_path, uploaded_by]
    );

    const docId = result.insertId;

    // Module-specific automated linkages
    if (reference_type === 'Candidate') {
      // Agar Candidate ka resume hai, toh candidate table ke resume_link ko bhi update karo
      await pool.query('UPDATE candidates SET resume_link = ? WHERE id = ?', [file_path, reference_id]);
    } else if (reference_type === 'Loan' && update_status) {
      await pool.query('UPDATE loan_applications SET status = ? WHERE id = ?', [update_status, reference_id]);
    } else if (reference_type === 'CreditCard' && update_status) {
      await pool.query('UPDATE credit_card_applications SET status = ? WHERE id = ?', [update_status, reference_id]);
    }

    res.status(201).json({
      message: 'Document successfully upload ho gaya!',
      document: {
        id: docId,
        reference_id: parseInt(reference_id),
        reference_type,
        document_type: docType,
        file_path,
        original_name: req.file.originalname,
        uploaded_by,
        uploaded_at: new Date()
      }
    });
  } catch (err) {
    console.error('uploadDocument error:', err);
    res.status(500).json({ message: 'Server error uploading document' });
  }
};

// 2. Fetch Documents with Filters & Enriched Entity Names
exports.getDocuments = async (req, res) => {
  try {
    const { reference_type, reference_id, module } = req.query;

    let query = `
      SELECT d.*, 
             u.name AS uploader_name,
             CASE 
               WHEN d.reference_type = 'Candidate' THEN c.name
               WHEN d.reference_type = 'Client' THEN cl.company_name
               WHEN d.reference_type = 'Lead' THEN ld.lead_title
               WHEN d.reference_type = 'Loan' THEN la.applicant_name
               WHEN d.reference_type = 'CreditCard' THEN ca.applicant_name
               ELSE 'General'
             END AS entity_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN candidates c ON d.reference_type = 'Candidate' AND d.reference_id = c.id
      LEFT JOIN clients cl ON d.reference_type = 'Client' AND d.reference_id = cl.id
      LEFT JOIN leads ld ON d.reference_type = 'Lead' AND d.reference_id = ld.id
      LEFT JOIN loan_applications la ON d.reference_type = 'Loan' AND d.reference_id = la.id
      LEFT JOIN credit_card_applications ca ON d.reference_type = 'CreditCard' AND d.reference_id = ca.id
      WHERE 1=1
    `;
    const params = [];

    if (reference_type) {
      query += ' AND d.reference_type = ?';
      params.push(reference_type);
    }

    if (reference_id) {
      query += ' AND d.reference_id = ?';
      params.push(reference_id);
    }

    if (module === 'Recruitment') {
      query += " AND d.reference_type IN ('Candidate', 'Job')";
    } else if (module === 'Business') {
      query += " AND d.reference_type IN ('Client', 'Lead')";
    } else if (module === 'Financial') {
      query += " AND d.reference_type IN ('Loan', 'CreditCard')";
    }

    query += ' ORDER BY d.uploaded_at DESC';

    const [docs] = await pool.query(query, params);
    res.json(docs);
  } catch (err) {
    console.error('getDocuments error:', err);
    res.status(500).json({ message: 'Server error fetching documents' });
  }
};

// 3. Delete Document
exports.deleteDocument = async (req, res) => {
  try {
    const docId = req.params.id;
    const [docs] = await pool.query('SELECT * FROM documents WHERE id = ?', [docId]);
    if (docs.length === 0) {
      return res.status(404).json({ message: 'Document nahi mila' });
    }

    const doc = docs[0];

    // Delete DB record
    await pool.query('DELETE FROM documents WHERE id = ?', [docId]);

    // Optional: Delete physical file if exists
    if (doc.file_path && doc.file_path.startsWith('/uploads/')) {
      const fileName = path.basename(doc.file_path);
      const fullPath = path.join(__dirname, '../../uploads', fileName);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) { /* ignore disk delete err */ }
      }
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('deleteDocument error:', err);
    res.status(500).json({ message: 'Server error deleting document' });
  }
};

