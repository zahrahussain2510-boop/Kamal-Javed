import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { extname, resolve, relative, isAbsolute, sep } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const dataDir = resolve(root, 'data');
const inquiriesFile = resolve(dataDir, 'inquiries.json');
const envFile = resolve(root, '.env');
const types = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.pdf': 'application/pdf', '.webp': 'image/webp',
};

try {
  const env = await readFile(envFile, 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
} catch {}

if (!process.env.ADMIN_PASSWORD) {
  process.env.ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'kamaladmin';
  process.env.ADMIN_PASSWORD = randomBytes(18).toString('base64url');
  process.env.PASSWORD_SALT = randomBytes(16).toString('hex');
  await writeFile(envFile, `ADMIN_USERNAME=${process.env.ADMIN_USERNAME}\nADMIN_PASSWORD=${process.env.ADMIN_PASSWORD}\nPASSWORD_SALT=${process.env.PASSWORD_SALT}\n`);
  process.stdout.write(`Created private admin login. Username: ${process.env.ADMIN_USERNAME} Password: ${process.env.ADMIN_PASSWORD}\n`);
}
const adminUsername = process.env.ADMIN_USERNAME || 'kamaladmin';
const adminPassword = process.env.ADMIN_PASSWORD;
const passwordSalt = process.env.PASSWORD_SALT || 'kamal-portfolio-admin';
const expectedPassword = scryptSync(adminPassword, passwordSalt, 64);
const sessions = new Map();
const loginAttempts = new Map();
let saving = Promise.resolve();

await mkdir(dataDir, { recursive: true });
try { await readFile(inquiriesFile); } catch { await writeFile(inquiriesFile, '[]\n'); }

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
  response.end(JSON.stringify(payload));
}

function readBody(request, maxBytes = 12_000) {
  return new Promise((resolveBody, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > maxBytes) {
        reject(Object.assign(new Error('Request too large'), { status: 413 }));
        request.destroy();
      }
    });
    request.on('end', () => {
      try { resolveBody(JSON.parse(body || '{}')); }
      catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); }
    });
    request.on('error', reject);
  });
}

function getSession(request) {
  const token = request.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('kj_admin='))?.slice('kj_admin='.length);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, session };
}

async function readInquiries() {
  try { return JSON.parse(await readFile(inquiriesFile, 'utf8')); }
  catch { return []; }
}

async function saveInquiries(inquiries) {
  saving = saving.then(() => writeFile(inquiriesFile, `${JSON.stringify(inquiries, null, 2)}\n`));
  return saving;
}

const server = createServer(async (request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400).end('Bad request'); return; }

  if (request.method === 'POST' && pathname === '/api/contact') {
    try {
      const body = await readBody(request, 8_000);
      const name = String(body.name || '').trim().slice(0, 100);
      const email = String(body.email || '').trim().slice(0, 254);
      const message = String(body.message || '').trim().slice(0, 5_000);
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
        sendJson(response, 400, { error: 'Add your name, a valid email and a message of at least 10 characters.' });
        return;
      }
      const inquiries = await readInquiries();
      inquiries.unshift({ id: randomBytes(12).toString('hex'), name, email, message, createdAt: new Date().toISOString(), status: 'new' });
      await saveInquiries(inquiries);
      sendJson(response, 201, { ok: true, message: 'Your project note has been received. Thank you.' });
    } catch (error) { sendJson(response, error.status || 400, { error: error.status === 413 ? 'Message is too large.' : 'Could not save your message.' }); }
    return;
  }

  if (request.method === 'POST' && pathname === '/api/admin/login') {
    const ip = request.socket.remoteAddress || 'local';
    const attempt = loginAttempts.get(ip) || { count: 0, until: 0 };
    if (attempt.until > Date.now()) { sendJson(response, 429, { error: 'Too many sign in attempts. Try again in 10 minutes.' }); return; }
    try {
      const body = await readBody(request, 2_000);
      const supplied = Buffer.from(String(body.password || ''));
      const candidate = scryptSync(supplied, passwordSalt, 64);
      const userOk = String(body.username || '') === adminUsername;
      const passwordOk = supplied.length > 0 && timingSafeEqual(candidate, expectedPassword);
      if (!userOk || !passwordOk) {
        attempt.count += 1;
        if (attempt.count >= 5) { attempt.until = Date.now() + 10 * 60_000; attempt.count = 0; }
        loginAttempts.set(ip, attempt);
        sendJson(response, 401, { error: 'Username or password is incorrect.' });
        return;
      }
      loginAttempts.delete(ip);
      const token = randomBytes(32).toString('hex');
      sessions.set(token, { expiresAt: Date.now() + 8 * 60 * 60_000 });
      sendJson(response, 200, { ok: true }, { 'Set-Cookie': `kj_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800` });
    } catch { sendJson(response, 400, { error: 'Could not sign in.' }); }
    return;
  }

  if (pathname.startsWith('/api/admin/')) {
    const auth = getSession(request);
    if (!auth) { sendJson(response, 401, { error: 'Sign in to continue.' }); return; }
    if (request.method === 'POST' && pathname === '/api/admin/logout') {
      sessions.delete(auth.token);
      sendJson(response, 200, { ok: true }, { 'Set-Cookie': 'kj_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
      return;
    }
    if (request.method === 'GET' && pathname === '/api/admin/inquiries') {
      sendJson(response, 200, { inquiries: await readInquiries() });
      return;
    }
    const match = pathname.match(/^\/api\/admin\/inquiries\/([a-f0-9]+)$/);
    if (match && request.method === 'PATCH') {
      try {
        const { status } = await readBody(request, 1_000);
        if (!['new', 'read', 'archived'].includes(status)) { sendJson(response, 400, { error: 'Invalid status.' }); return; }
        const inquiries = await readInquiries();
        const item = inquiries.find(inquiry => inquiry.id === match[1]);
        if (!item) { sendJson(response, 404, { error: 'Message not found.' }); return; }
        item.status = status;
        await saveInquiries(inquiries);
        sendJson(response, 200, { ok: true });
      } catch { sendJson(response, 400, { error: 'Could not update message.' }); }
      return;
    }
    sendJson(response, 404, { error: 'Not found.' });
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }

  let filePath = resolve(root, `.${pathname}`);
  const relativePath = relative(root, filePath);
  const blockedPath = relativePath.split(sep).some(segment => segment && segment !== '.' && segment.startsWith('.')) || relativePath === 'data' || relativePath.startsWith(`data${sep}`);
  if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath) || blockedPath) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  if (pathname === '/admin') filePath = resolve(root, 'admin.html');

  try {
    if ((await stat(filePath)).isDirectory()) filePath = resolve(filePath, 'index.html');
    const content = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': types[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': content.length, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self' data: blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    });
    if (request.method === 'HEAD') response.end();
    else response.end(content);
  } catch { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found'); }
});

const port = Number(process.argv[2] || 4174);
server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Portfolio and inquiry backend ready at http://127.0.0.1:${port}\n`);
});
