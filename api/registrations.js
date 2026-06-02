import { neon } from '@neondatabase/serverless';

// Vercel automatically creates a variable like DATABASE_URL or NEON_DATABASE_URL.
// Make sure this matches the variable name Vercel added to your Environment Variables!
const sql = neon(process.env.DATABASE_URL || process.env.STORAGE_URL);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { password } = req.body;

    // Use an environment variable for the password check
    if (password !== process.env.REGISTRATION_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const rows = await sql`SELECT * FROM registrations ORDER BY created_at DESC`;
      return res.json({ success: true, registrations: rows });
    } catch (error) {
      return res.status(500).json({ error: 'Database query failed', details: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method Not Allowed' });
}
