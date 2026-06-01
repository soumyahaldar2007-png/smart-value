cat > api/registrations.js << 'EOF'
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.STORAGE_URL);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { password } = req.body;
    if (password !== 'Som2007') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const rows = await sql`SELECT * FROM registrations ORDER BY created_at DESC`;
    res.json({ success: true, registrations: rows });
  }
}
EOF
