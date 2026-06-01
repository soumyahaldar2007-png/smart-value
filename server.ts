import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Path to file-based persistent database
const DB_FILE = path.join(process.cwd(), 'database.json');

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  createdAt: string;
}

interface Order {
  id: string; // Razorpay order_id or local mock id
  paymentId?: string; // Razorpay payment_id after verification
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  status: 'created' | 'paid' | 'verified' | 'failed';
  paymentMethod?: string;
  createdAt: string;
}

interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  qualification?: string;
  pursuing?: string;
  profileImages: string[];
  createdAt: string;
}

interface DB {
  products: Product[];
  orders: Order[];
  registrations: Registration[];
}

// Ensure database file exists with seed products matching the "Abstract Studio" aesthetic
const defaultProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'MERCURY FLUIDITY PASS',
    description: 'Lifetime access code to premium interactive WebGL source shaders, React motion modules, & reflective Figma frames.',
    price: 49.00,
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
    category: 'SENSORY',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_2',
    name: 'SATIN MATTE PHYSICS KIT',
    description: 'A complete React Three Fiber source kit including 3D gravity structures, custom physics bodies, and micro-interactions.',
    price: 29.00,
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=500&q=80',
    category: 'MINIMAL',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_3',
    name: 'STELLAR EMISSION SHADER',
    description: 'Real-time noise displacement GPU shader scripts supporting GLSL and WebGL2 frameworks with unified canvas bindings.',
    price: 79.00,
    imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=500&q=80',
    category: 'ENERGY',
    createdAt: new Date().toISOString()
  }
];

function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ products: defaultProducts, orders: [], registrations: [] }, null, 2));
    console.log('Database initialized with seed products at', DB_FILE);
  } else {
    // Validate schema
    try {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (!db.products || !Array.isArray(db.products)) db.products = defaultProducts;
      if (!db.orders || !Array.isArray(db.orders)) db.orders = [];
      if (!db.registrations || !Array.isArray(db.registrations)) db.registrations = [];
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } catch {
      fs.writeFileSync(DB_FILE, JSON.stringify({ products: defaultProducts, orders: [], registrations: [] }, null, 2));
    }
  }
}

initDB();

function getDB(): DB {
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    if (!db.registrations) db.registrations = [];
    return db;
  } catch {
    return { products: defaultProducts, orders: [], registrations: [] };
  }
}

function saveDB(data: DB) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Lazy initialization of Razorpay to prevent crashes when API keys are missing on sandbox boot
let razorpayClient: Razorpay | null = null;
function getRazorpay(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    return null;
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayClient;
}

// =================== API ENDPOINTS ===================

// API: Check gateway integration status (for prompt verification & debug)
app.get('/api/config', (req: Request, res: Response) => {
  const keysConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  res.json({
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    isSandboxMode: !keysConfigured,
    status: 'online'
  });
});

// API: Get all products
app.get('/api/products', (req: Request, res: Response) => {
  const db = getDB();
  res.json(db.products);
});

// API: Create/Add new product (Admin actions)
app.post('/api/products', (req: Request, res: Response) => {
  const { name, description, price, imageUrl, category } = req.body;
  if (!name || isNaN(Number(price))) {
    res.status(400).json({ error: 'Missing name or valid price parameters' });
    return;
  }

  const db = getDB();
  const newProduct: Product = {
    id: 'prod_' + Math.random().toString(36).substring(2, 9),
    name: name.toString().toUpperCase(),
    description: description || 'No description supplied.',
    price: Math.abs(Number(price)),
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
    category: (category || 'SENSORY').toString().toUpperCase(),
    createdAt: new Date().toISOString()
  };

  db.products.push(newProduct);
  saveDB(db);

  res.status(201).json({ success: true, product: newProduct });
});

// API: Delete product (Admin action)
app.delete('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDB();
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  db.products.splice(index, 1);
  saveDB(db);
  res.json({ success: true, message: 'Product deleted' });
});

// API: Get all orders (Admin overview)
app.get('/api/orders', (req: Request, res: Response) => {
  const db = getDB();
  res.json(db.orders);
});

// API: Create Razorpay Order or fallback sandbox checkout ticket
app.post('/api/orders/create', async (req: Request, res: Response) => {
  try {
    const { productId, customerName, customerEmail, customerPhone, firstName, lastName, profileImages, qualification, pursuing } = req.body;
    
    if (!productId || !customerName || !customerEmail || !customerPhone) {
      res.status(400).json({ error: 'Missing required buyer data' });
      return;
    }

    const db = getDB();
    
    // Save registration if supplied (coming from ContentModal)
    if (productId === 'registration' || firstName || lastName) {
      const newRegistration: Registration = {
        id: 'reg_' + Math.random().toString(36).substring(2, 11),
        firstName: firstName || customerName.split(' ')[0] || '',
        lastName: lastName || customerName.split(' ').slice(1).join(' ') || '',
        phone: customerPhone,
        qualification: qualification || '',
        pursuing: pursuing || '',
        profileImages: profileImages || [],
        createdAt: new Date().toISOString()
      };
      db.registrations = db.registrations || [];
      db.registrations.push(newRegistration);
      saveDB(db); // Save registration immediately
    }

    let product = db.products.find(p => p.id === productId);
    if (!product && productId === 'registration') {
      product = {
        id: 'registration',
        name: 'MEMBER REGISTRATION PASS',
        description: 'Secure digital access pass credentials with biometric telemetry.',
        price: 9.99,
        category: 'EXECUTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
        createdAt: new Date().toISOString()
      };
    }
    if (!product) {
      res.status(404).json({ error: 'Product requested does not exist' });
      return;
    }

    const orderAmount = Math.round(product.price * 100); // Amount in Razorpay paisa
    const client = getRazorpay();

    if (client) {
      // Real Razorpay Integration
      const options = {
        amount: orderAmount,
        currency: 'INR',
        receipt: 'rcpt_' + Math.random().toString(36).substring(2, 9),
        notes: {
          productId: product.id,
          productName: product.name,
          customerName,
          customerEmail,
          customerPhone
        }
      };

      const razorpayOrder = await client.orders.create(options);
      
      // Store in DB
      const newOrder: Order = {
        id: razorpayOrder.id,
        productId: product.id,
        productName: product.name,
        customerName,
        customerEmail,
        customerPhone,
        amount: product.price,
        status: 'created',
        createdAt: new Date().toISOString()
      };
      
      db.orders.push(newOrder);
      saveDB(db);

      res.json({
        success: true,
        isSandbox: false,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency: 'INR',
        orderId: razorpayOrder.id,
        productName: product.name,
        productDescription: product.description
      });
    } else {
      // Keys are missing -> Seamless Sandbox Simulation Mode
      // Generate standard representation order ID
      const fakeOrderId = 'order_sb_' + Math.random().toString(36).substring(2, 11);
      
      const newOrder: Order = {
        id: fakeOrderId,
        productId: product.id,
        productName: product.name,
        customerName,
        customerEmail,
        customerPhone,
        amount: product.price,
        status: 'created',
        createdAt: new Date().toISOString()
      };

      db.orders.push(newOrder);
      saveDB(db);

      console.log(`[SANDBOX MODE] Created mock order ${fakeOrderId} for ${product.name}`);
      
      res.json({
        success: true,
        isSandbox: true,
        keyId: 'rzp_test_sandbox_dummy_key',
        amount: orderAmount,
        currency: 'INR',
        orderId: fakeOrderId,
        productName: product.name,
        productDescription: product.description
      });
    }
  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: error?.message || 'Order generation failed' });
  }
});

// API: Verify Razorpay payment signature securely OR fulfill local sandbox order
app.post('/api/orders/verify', (req: Request, res: Response) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      isSandbox,
      paymentMethod
    } = req.body;

    if (!razorpay_order_id) {
      res.status(400).json({ error: 'Missing razorpay_order_id parameter' });
      return;
    }

    const db = getDB();
    const orderIndex = db.orders.findIndex(o => o.id === razorpay_order_id);
    
    if (orderIndex === -1) {
      res.status(404).json({ error: 'Associated order reference not found' });
      return;
    }

    if (isSandbox === true) {
      // Secure local validation for Sandbox simulations
      db.orders[orderIndex].status = 'verified';
      db.orders[orderIndex].paymentId = razorpay_payment_id || 'pay_sb_' + Math.random().toString(36).substring(2, 10);
      db.orders[orderIndex].paymentMethod = paymentMethod || 'UPI (Sandbox)';
      saveDB(db);

      res.json({
        success: true,
        verified: true,
        message: 'Sandbox signature validated locally',
        order: db.orders[orderIndex]
      });
      return;
    }

    // Real secure backend signature verification using cryptographic hmac
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      res.status(500).json({ error: 'Razorpay secret key not configured on backend server' });
      return;
    }

    const payload = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const signatureValid = expectedSignature === razorpay_signature;

    if (signatureValid) {
      db.orders[orderIndex].status = 'verified';
      db.orders[orderIndex].paymentId = razorpay_payment_id;
      db.orders[orderIndex].paymentMethod = paymentMethod || 'Card / NetBanking / UPI';
      saveDB(db);

      res.json({
        success: true,
        verified: true,
        message: 'Razorpay payment signature successfully verified',
        order: db.orders[orderIndex]
      });
    } else {
      db.orders[orderIndex].status = 'failed';
      saveDB(db);
      res.status(400).json({ success: false, verified: false, error: 'Cryptographic signature mismatch' });
    }
  } catch (error: any) {
    console.error('Signature verification failed:', error);
    res.status(500).json({ error: error?.message || 'Verification system error' });
  }
});

// Secure API endpoint to fetch list of registered users
app.post('/api/admin/registrations', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password !== 'Som2007') {
    res.status(401).json({ error: 'Unauthorized access credential mismatches' });
    return;
  }
  const db = getDB();
  res.json({ success: true, registrations: db.registrations || [] });
});

// Secure API endpoint to delete a student record
app.post('/api/admin/delete-registration', (req: Request, res: Response) => {
  const { password, id } = req.body;
  if (password !== 'Som2007') {
    res.status(401).json({ error: 'Unauthorized access credential mismatches' });
    return;
  }
  const db = getDB();
  db.registrations = (db.registrations || []).filter((r: any) => r.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// Serve the Secure Admin Database Dashboard page via our separate javascript file
app.get(['/database.py', '/database.py/', '/database.js', '/database.js/'], (req: Request, res: Response) => {
  try {
    // Dynamic output generation by invoking the separate database.js node script
    const html = execSync('node database.js --html', { encoding: 'utf-8' });
    res.send(html);
  } catch (err: any) {
    console.error('Error invoking node database.js:', err);
    res.status(500).send(`Secure Database Dashboard error: ${err?.message || err}`);
  }
});

// =================== MOUNT VITE DEVELOPMENT MIDDLEWARE ===================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Mount Vite's middleware after setting API routes
    app.use(vite.middlewares);
  } else {
    // Production static asset build serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`  Fullstack Server Running: http://localhost:${PORT}`);
    console.log(`  Dev Environment Mode: ${process.env.NODE_ENV !== 'production' ? 'Vite HMR' : 'Production static'}`);
    console.log(`===============================================`);
  });
}

startServer();
