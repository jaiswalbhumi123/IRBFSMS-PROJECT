const db = require('./src/config/db');

async function checkAllData() {
  console.log('\n=============================================================');
  console.log('       BENEFIT BUSINESS SOLUTIONS - DATABASE VIEWER');
  console.log('=============================================================\n');

  try {
    // 1. CLIENTS
    console.log('🏢 [CLIENTS DIRECTORY] (Module 3 - Client Management)');
    const [clients] = await db.query(
      'SELECT id, company_name, contact_person, email, phone, business_requirements, status FROM clients ORDER BY id ASC'
    );
    console.table(clients);

    // 2. LEADS
    console.log('\n🎯 [BUSINESS LEADS] (Module 3 - Lead Management)');
    const [leads] = await db.query(`
      SELECT l.id, l.lead_title, l.source, l.service_required, 
             COALESCE(u.name, 'Rahul Verma') AS executive,
             l.status, DATE_FORMAT(l.follow_up_date, '%Y-%m-%d') AS follow_up_date, l.remarks 
      FROM leads l 
      LEFT JOIN users u ON l.assigned_to = u.id 
      ORDER BY l.id ASC
    `);
    console.table(leads);

    // 3. STATS SUMMARY
    const [[totalLeads]] = await db.query('SELECT COUNT(*) as c FROM leads');
    const [[activeLeads]] = await db.query("SELECT COUNT(*) as c FROM leads WHERE status IN ('Open', 'In Progress')");
    const [[convertedLeads]] = await db.query("SELECT COUNT(*) as c FROM leads WHERE status = 'Converted'");
    const [[totalClients]] = await db.query('SELECT COUNT(*) as c FROM clients');
    const [[activeClients]] = await db.query("SELECT COUNT(*) as c FROM clients WHERE status = 'Active'");

    console.log('\n📊 [CRM DASHBOARD 5 METRICS]');
    console.log(`- Total Leads:          ${totalLeads.c}`);
    console.log(`- Active Leads:         ${activeLeads.c}`);
    console.log(`- Converted Leads:      ${convertedLeads.c}`);
    console.log(`- Total Clients:        ${totalClients.c}`);
    console.log(`- Active Clients:       ${activeClients.c}`);

    console.log('\n=============================================================\n');
  } catch (err) {
    console.error('Error fetching data:', err.message);
  } finally {
    process.exit(0);
  }
}

checkAllData();

