cat > api/products.js << 'EOF'
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.STORAGE_URL);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM products ORDER BY created_at DESC`;
    res.json(rows);
  } else if (req.method === 'POST') {
    const { name, description, price, imageUrl, category } = req.body;
    const id = 'prod_' + Math.random().toString(36).substring(2, 9);
    await sql`INSERT INTO products (id, name, description, price, image_url, category) VALUES (${id}, ${name.toUpperCase()}, ${description}, ${price}, ${imageUrl}, ${category?.toUpperCase()})`;
    res.status(201).json({ success: true });
  }
}
EOF
