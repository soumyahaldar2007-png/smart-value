import { neon } from '@neondatabase/serverless';

// Connect to Neon using the environment variable Vercel created for you
const sql = neon(process.env.DATABASE_URL || process.env.STORAGE_URL);

export default async function handler(req, res) {
  // 1. If someone sends a POST request, they are submitting the form data
  if (req.method === 'POST') {
    try {
      // Extract the form fields sent from the frontend website
      const { firstName, lastName, contactNumber, qualification, pursuing } = req.body;

      // Basic check to make sure crucial information isn't missing
      if (!firstName || !lastName || !contactNumber) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Insert the data into your Neon Postgres table
      await sql`
        INSERT INTO registrations (first_name, last_name, contact_number, qualification, pursuing)
        VALUES (${firstName}, ${lastName}, ${contactNumber}, ${qualification}, ${pursuing});
      `;

      // Reply back to the frontend that it worked perfectly!
      return res.status(200).json({ success: true, message: 'Registration saved!' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database saving failed', details: error.message });
    }
  }

  // 2. Keep this password check ONLY if you want an admin to fetch all data later via a GET request
  if (req.method === 'GET') {
    const { password } = req.query; // Pass as a URL query parameter instead
    if (password !== process.env.REGISTRATION_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const rows = await sql`SELECT * FROM registrations ORDER BY created_at DESC`;
      return res.json({ success: true, registrations: rows });
    } catch (error) {
      return res.status(500).json({ error: 'Database fetching failed' });
    }
  }

  // If it's not POST or GET, deny the request
  return res.status(405).json({ error: 'Method Not Allowed' });
}
