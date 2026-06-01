#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import http from 'http';
import readline from 'readline';

const DB_PATH = 'database.json';
const PASSWORD = 'Som2007';

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database System | database.js</title>
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
          <h2 class="text-xl font-medium tracking-tight text-white uppercase font-mono-custom">SYSTEM LOCK // DATABASE.JS</h2>
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
            <p class="text-[9px] text-zinc-500 font-mono-custom">// DATABASE.JS TERMINAL v1.0.2</p>
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
            <div class="flex items-center -space-x-3 cursor-pointer" onclick="openImageOverlay('\${item.profileImages[0]}', '\${item.firstName} \${item.lastName}')">
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

    // High resolution preview overlay
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

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    return { products: [], orders: [], registrations: [] };
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') {
      return { products: [], orders: [], registrations: [] };
    }
    if (!data.registrations) {
      data.registrations = [];
    }
    return data;
  } catch (err) {
    return { products: [], orders: [], registrations: [] };
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[!] Error saving to database JSON file:`, err);
  }
}

function runStandaloneServer(port = 3050) {
  const server = http.createServer((req, res) => {
    res.setHeader('X-Powered-By', 'Node-database.js');
    
    // Parse URL path
    const url = req.url || '/';
    const cleanPath = url.split('?')[0];

    if (req.method === 'GET') {
      if (['/', '/database.py', '/database.py/', '/database.js', '/database.js/'].includes(cleanPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(HTML_TEMPLATE);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          if (cleanPath === '/api/admin/registrations') {
            if (payload.password === PASSWORD) {
              const db = loadDB();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, registrations: db.registrations || [] }));
            } else {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Unauthorized' }));
            }
          } else if (cleanPath === '/api/admin/delete-registration') {
            if (payload.password === PASSWORD) {
              const db = loadDB();
              const regId = payload.id;
              db.registrations = (db.registrations || []).filter(r => r.id !== regId);
              saveDB(db);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } else {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Unauthorized' }));
            }
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          }
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    } else {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[*] Standalone javascript database.js web server started successfully!`);
    console.log(`[*] Admin dashboard URL: http://localhost:\${port}/database.js`);
    console.log(`[*] Password is: \${PASSWORD}`);
    console.log(`[*] Please press Ctrl+C to stop the node server instance.`);
  });
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function runCliTerminal() {
  console.log("=".repeat(74));
  console.log("   ░██████╗░███████╗░██████╗░██╗░░██╗██████╗░░█████╗░░██████╗░███████╗");
  console.log("   ██╔════╝░██╔════╝██╔════╝░██║░░██║██╔══██╗██╔══██╗██╔════╝░██╔════╝");
  console.log("   ╚█████╗░░█████╗░░██║░░██╗░██║░░██║██████╔╝███████║╚█████╗░░█████╗░░");
  console.log("   ░╚═══██╗░██╔══╝░░██║░░╚██╗██║░░██║██╔═══╝░██╔══██║░╚═══██╗██╔══╝░░");
  console.log("   ██████╔╝░███████╗╚██████╔╝╚██████╔╝██║░░░░░██║░░██║██████╔╝███████╗");
  console.log("   ╚═════╝░░╚══════╝░╚═════╝░░╚═════╝░╚═╝░░░░░╚═╝░░╚═╝╚═════╝░╚══════╝");
  console.log("                 DATABASE.JS MANAGEMENT CONSOLE TERMINAL");
  console.log("=".repeat(74));

  const p = await askQuestion("Enter secure login password: ");
  if (p !== PASSWORD) {
    console.log("[!] ACCESS DENIED: Password authentication failure.");
    process.exit(1);
  }

  console.log("[✓] ACCESS GRANTED. Initializing local database.json reader...");

  while (true) {
    const db = loadDB();
    const regs = db.registrations || [];
    console.log("\n" + "=".repeat(74));
    console.log(` REGISTERED STUDENTS [${regs.length} records]`);
    console.log("=".repeat(74));
    console.log(`${'S.No'.padEnd(5)} | ${'Full Name'.padEnd(22)} | ${'Phone Number'.padEnd(14)} | ${'Qualification'.padEnd(14)} | ${'Pursuing'.padEnd(14)}`);
    console.log("-".repeat(74));
    regs.forEach((r, idx) => {
      const name = `${r.firstName || ''} ${r.lastName || ''}`.trim();
      const sNo = (idx + 1).toString().padEnd(5);
      const nameCol = name.substring(0, 22).padEnd(22);
      const phoneCol = (r.phone || '-').substring(0, 14).padEnd(14);
      const qualCol = (r.qualification || '-').substring(0, 14).padEnd(14);
      const pursCol = (r.pursuing || '-').substring(0, 14).padEnd(14);
      console.log(`${sNo} | ${nameCol} | ${phoneCol} | ${qualCol} | ${pursCol}`);
    });
    console.log("-".repeat(74));
    console.log("  1. Reload Data        2. Search Registrations       3. Delete Registration Record");
    console.log("  4. Start HTTP Server  5. Exit console");
    console.log("=".repeat(74));

    const choice = await askQuestion("Select an operation option [1-5]: ");
    if (choice === '1') {
      continue;
    } else if (choice === '2') {
      const q = (await askQuestion("Enter search query (name/phone/qual/pursuing): ")).toLowerCase();
      const results = [];
      regs.forEach((r, idx) => {
        const fullName = `${r.firstName || ''} ${r.lastName || ''}`.trim().toLowerCase();
        const phone = (r.phone || '').toLowerCase();
        const qual = (r.qualification || '').toLowerCase();
        const purs = (r.pursuing || '').toLowerCase();
        if (fullName.includes(q) || phone.includes(q) || qual.includes(q) || purs.includes(q)) {
          results.push({ sNo: idx + 1, record: r });
        }
      });
      console.log(`\n[Search results found: ${results.length} matches]`);
      console.log("-".repeat(74));
      results.forEach(res => {
        const r = res.record;
        const fullName = `${r.firstName || ''} ${r.lastName || ''}`.trim();
        console.log(`[${res.sNo}] ${fullName} - Phone: ${r.phone || '-'} (Qual: ${r.qualification || '-'}, Purs: ${r.pursuing || '-'})`);
      });
      await askQuestion("\nPress [Enter] to continue back to console menu...");
    } else if (choice === '3') {
      const snoStr = await askQuestion("Enter Serial No (S.No) of registration record to delete: ");
      try {
        const sno = parseInt(snoStr, 10);
        if (sno >= 1 && sno <= regs.length) {
          const targetId = regs[sno - 1].id;
          db.registrations = regs.filter(r => r.id !== targetId);
          saveDB(db);
          console.log(`[✓] Registration record S.No ${sno} was successfully deleted from system.`);
        } else {
          console.log("[!] Error: No record found at serial number", sno);
        }
      } catch (err) {
        console.log("[!] Error: Please enter a valid numerical serial number.");
      }
      await askQuestion("\nPress [Enter] to return...");
    } else if (choice === '4') {
      runStandaloneServer();
      break;
    } else if (choice === '5') {
      console.log("[*] Secure console closed. Goodbye.");
      process.exit(0);
    }
  }
}

// CLI / Standalone execution router
const args = process.argv.slice(2);
let mode = null;
let customPort = 3050;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--html') {
    mode = 'html';
  } else if (args[i] === '--server') {
    mode = 'server';
  } else if (args[i] === '--cli') {
    mode = 'cli';
  } else if (args[i] === '--port' && i + 1 < args.length) {
    customPort = parseInt(args[i + 1], 10) || 3050;
    i++;
  }
}

if (mode === 'html') {
  process.stdout.write(HTML_TEMPLATE);
  process.exit(0);
} else if (mode === 'server') {
  runStandaloneServer(customPort);
} else if (mode === 'cli') {
  runCliTerminal();
} else {
  if (process.stdout.isTTY) {
    runCliTerminal();
  } else {
    runStandaloneServer(customPort);
  }
}
