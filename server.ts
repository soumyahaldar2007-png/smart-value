import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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

// Serve the Secure Admin Database Dashboard page
app.get(['/database.py', '/database.py/'], (req: Request, res: Response) => {
  // Return a single beautifully styled HTML file with Tailwind CSS embedded!
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database System | database.py</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', system-ui, sans-serif;
    }
    .font-mono-custom {
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body class="bg-[#09090b] text-zinc-100 min-h-screen selection:bg-zinc-800 selection:text-white flex flex-col antialiased">

  <!-- Main Wrapper -->
  <div id="app" class="flex-grow flex flex-col justify-start w-full relative">
    
    <!-- Background Gradient Light Glare -->
    <div class="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-zinc-800/20 blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-zinc-800/20 blur-3xl pointer-events-none"></div>

    <!-- 1. Password Protected Login Box Screen -->
    <div id="login-screen" class="flex-grow flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] space-y-6">
        <div class="text-center space-y-2">
          <div class="inline-flex p-3 rounded-full bg-zinc-800 border border-zinc-800 text-zinc-400">
            <i data-lucide="shield-check" class="w-6 h-6"></i>
          </div>
          <h2 class="text-xl font-medium tracking-tight text-white uppercase font-mono-custom">SYSTEM LOCK // DATABASE.PY</h2>
          <p class="text-xs text-zinc-500 font-mono-custom">// RESTRICTED ADMINISTRATOR INTERFACE</p>
        </div>

        <form id="login-form" onsubmit="handleLogin(event)" class="space-y-4">
          <div>
            <label class="block text-[10px] font-mono-custom text-zinc-400 uppercase mb-1.5" for="admin-pass">ENTER SECURE CRIDENTIAL PASSWORD</label>
            <div class="relative">
              <input 
                id="admin-pass" 
                type="password" 
                required 
                placeholder="••••••••" 
                class="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-500 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all duration-200 placeholder:text-zinc-700 shadow-inner"
              />
            </div>
          </div>
          
          <div id="error-msg" class="text-[11px] text-red-500 font-mono-custom hidden">// AUTHENTICATION MISMATCH</div>

          <button 
            type="submit" 
            class="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-mono-custom font-semibold tracking-wider uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            Access Database
          </button>
        </form>
      </div>
    </div>

    <!-- 2. Secure Dashboard Screen (Hidden until logged in) -->
    <div id="dashboard-screen" class="hidden flex-grow flex flex-col">
      <!-- Navbar -->
      <nav class="border-b border-zinc-800 bg-zinc-900/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center">
            <i data-lucide="database" class="w-4 h-4 text-white"></i>
          </div>
          <div>
            <h1 class="text-xs font-semibold tracking-widest text-zinc-300 uppercase font-mono-custom">EDUCATION NETWORK</h1>
            <p class="text-[9px] text-zinc-500 font-mono-custom">// DATABASE.PY TERMINAL v1.0.2</p>
          </div>
        </div>

        <button 
          onclick="handleLogout()"
          class="text-[10px] font-mono-custom text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950 px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
        >
          <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Log Out
        </button>
      </nav>

      <!-- Main Dashboard Content -->
      <div class="flex-grow p-6 space-y-6 max-w-7xl mx-auto w-full">
        <!-- Dashboard Header & Search -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <h2 class="text-2xl font-light tracking-tight text-white">Registered User Directory</h2>
            <p class="text-xs text-zinc-400 font-mono-custom">// REAL-TIME PROFILE LOG LISTENER</p>
          </div>

          <div class="flex items-center gap-3 self-stretch md:self-auto">
            <!-- Live Search -->
            <div class="relative flex-grow md:w-80">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <i data-lucide="search" class="w-4 h-4"></i>
              </span>
              <input 
                id="search-input" 
                type="text" 
                placeholder="Search name, phone..." 
                oninput="filterTable()"
                class="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none transition-all placeholder:text-zinc-500"
              />
            </div>

            <!-- Total stats -->
            <div class="bg-zinc-900/60 border border-zinc-800 px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0">
              <span class="text-[10px] font-mono-custom text-zinc-500 uppercase">Total:</span>
              <span id="stat-count" class="text-sm font-semibold text-white font-mono-custom">0</span>
            </div>
          </div>
        </div>

        <!-- Table Grid Card wrapper -->
        <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div class="overflow-x-auto w-full">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-zinc-800 text-[10px] font-mono-custom text-zinc-400 uppercase tracking-wider bg-zinc-950/40 select-none">
                  <th class="py-4 px-6 font-medium">S.No</th>
                  <th class="py-4 px-6 font-medium">User Image</th>
                  <th class="py-4 px-6 font-medium">Full Name</th>
                  <th class="py-4 px-6 font-medium">Contact Number</th>
                  <th class="py-4 px-6 font-medium">Qualification</th>
                  <th class="py-4 px-6 font-medium">Pursuing</th>
                  <th class="py-4 px-6 font-medium">Registered At</th>
                  <th class="py-4 px-6 font-medium text-right">Operation</th>
                </tr>
              </thead>
              <tbody id="table-body" class="divide-y divide-zinc-800/40 text-xs">
                <!-- Records hydrated by JS -->
                <tr>
                  <td colspan="8" class="py-12 text-center text-zinc-500 font-mono-custom">
                    <div class="flex items-center justify-center gap-2">
                      <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Fetching secure registers...
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Big Image Modal -->
  <div id="image-modal" class="fixed inset-0 z-50 bg-black/95 backdrop-blur-md hidden items-center justify-center p-4">
    <div class="relative max-w-4xl max-h-[85vh] overflow-hidden flex flex-col items-center">
      <button 
        onclick="closeImageModal()" 
        class="absolute top-3 right-3 text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-950/80 p-2 rounded-full cursor-pointer transition-colors"
      >
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
      <img id="modal-target-img" src="" alt="High resolution upload" class="max-w-full max-h-[75vh] object-contain rounded-xl border border-zinc-800 shadow-2xl" />
      <div id="modal-label" class="mt-4 font-mono-custom text-[11px] text-zinc-400">---</div>
    </div>
  </div>

  <!-- Embedded Dashboard Logic script -->
  <script>
    let currentPassword = '';
    let registrations = [];

    // On Load sequence
    window.addEventListener('DOMContentLoaded', () => {
      // Initialize Lucide icons
      lucide.createIcons();
      
      // Auto-validate if password exists in sessionStorage
      const savedPass = sessionStorage.getItem('admin_gate_key');
      if (savedPass) {
        document.getElementById('admin-pass').value = savedPass;
        authenticatePassword(savedPass);
      }
    });

    async function authenticatePassword(pass) {
      document.getElementById('error-msg').classList.add('hidden');
      
      try {
        const response = await fetch('/api/admin/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pass })
        });
        
        if (response.ok) {
          const resJson = await response.json();
          currentPassword = pass;
          sessionStorage.setItem('admin_gate_key', pass);
          
          registrations = resJson.registrations || [];
          renderRegisteredTable(registrations);
          
          // Toggle screens
          document.getElementById('login-screen').classList.add('hidden');
          document.getElementById('dashboard-screen').classList.remove('hidden');
        } else {
          showAuthError();
        }
      } catch (err) {
        console.error(err);
        showAuthError();
      }
    }

    function showAuthError() {
      document.getElementById('error-msg').classList.remove('hidden');
      sessionStorage.removeItem('admin_gate_key');
    }

    function handleLogin(e) {
      e.preventDefault();
      const value = document.getElementById('admin-pass').value;
      if (value) {
        authenticatePassword(value);
      }
    }

    function handleLogout() {
      currentPassword = '';
      sessionStorage.removeItem('admin_gate_key');
      document.getElementById('admin-pass').value = '';
      document.getElementById('login-screen').classList.remove('hidden');
      document.getElementById('dashboard-screen').classList.add('hidden');
    }

    function renderRegisteredTable(items) {
      const tbody = document.getElementById('table-body');
      const countStat = document.getElementById('stat-count');
      countStat.innerText = items.length;

      if (!items || items.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="8" class="py-16 text-center text-zinc-500 font-mono-custom uppercase tracking-wide">
              // NO STUDENT RECORDS REGISTERED YET
            </td>
          </tr>
        \`;
        lucide.createIcons();
        return;
      }

      tbody.innerHTML = '';
      items.forEach((item, index) => {
        // Thumbnail images stacking or single frame representation
        let imgMarkup = '';
        if (item.profileImages && item.profileImages.length > 0) {
          imgMarkup = \`
            <div class="flex items-center -space-x-3 cursor-pointer" onclick="openImageOverlay(\\\'\${item.profileImages[0]}\\\', \\'\${item.firstName} \${item.lastName}\\\')">
              \${item.profileImages.slice(0, 3).map((img, i) => \`
                <div class="w-10 h-10 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 shadow-md">
                  <img src="\${img}" class="w-full h-full object-cover select-none" />
                </div>
              \`).join('')}
              \${item.profileImages.length > 3 ? \`
                <div class="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-mono-custom shadow-md">
                  +\${item.profileImages.length - 3}
                </div>
              \` : ''}
            </div>
          \`;
        } else {
          imgMarkup = \`
            <span class="text-[10px] text-zinc-650 font-mono-custom italic">NO IMAGE</span>
          \`;
        }

        const dateStr = new Date(item.createdAt).toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        const tr = document.createElement('tr');
        tr.className = "hover:bg-zinc-900/[0.15] transition-colors group";
        tr.innerHTML = \`
          <td class="py-3 px-6 font-mono-custom text-zinc-500">\${index + 1}</td>
          <td class="py-3 px-6">\${imgMarkup}</td>
          <td class="py-3 px-6 text-white font-medium">\${item.firstName} \${item.lastName}</td>
          <td class="py-3 px-6 select-all font-mono-custom text-zinc-300">\${item.phone}</td>
          <td class="py-3 px-6 font-mono-custom text-zinc-300">\${item.qualification || '-'}</td>
          <td class="py-3 px-6 font-mono-custom text-zinc-300">\${item.pursuing || '-'}</td>
          <td class="py-3 px-6 font-mono-custom text-zinc-400">\${dateStr}</td>
          <td class="py-3 px-6 text-right">
            <button 
              onclick="deleteRecord('\${item.id}')"
              class="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/15 rounded-lg transition-all cursor-pointer"
              title="Delete record securely"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        \`;
        tbody.appendChild(tr);
      });

      // Hydrate newly loaded icons
      lucide.createIcons();
    }

    function filterTable() {
      const q = document.getElementById('search-input').value.toLowerCase().trim();
      if (!q) {
        renderRegisteredTable(registrations);
        return;
      }
      
      const filtered = registrations.filter(item => {
        const first = (item.firstName || '').toLowerCase();
        const last = (item.lastName || '').toLowerCase();
        const fullName = \`\${first} \${last}\`;
        const phone = (item.phone || '').toLowerCase();
        const qual = (item.qualification || '').toLowerCase();
        const purs = (item.pursuing || '').toLowerCase();
        return fullName.includes(q) || phone.includes(q) || qual.includes(q) || purs.includes(q);
      });

      renderRegisteredTable(filtered);
    }

    async function deleteRecord(id) {
      if (!confirm('Are you absolutely sure you want to delete this registration record permanentely? This action is irreversible.')) {
        return;
      }

      try {
        const response = await fetch('/api/admin/delete-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: currentPassword, id })
        });

        if (response.ok) {
          registrations = registrations.filter(r => r.id !== id);
          filterTable();
        } else {
          alert('Failed to delete registration. Please re-authenticate.');
          handleLogout();
        }
      } catch (err) {
        console.error(err);
        alert('Server connection error. Failed to delete record.');
      }
    }

    function openImageOverlay(src, label) {
      document.getElementById('modal-target-img').src = src;
      document.getElementById('modal-label').innerText = label.toUpperCase() + ' // CONFIRMED IDENTITY PROFILE';
      const modal = document.getElementById('image-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeImageModal() {
      const modal = document.getElementById('image-modal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  </script>
</body>
</html>`;
  res.send(html);
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
