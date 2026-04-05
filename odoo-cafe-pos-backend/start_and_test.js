// start-and-test.js - Starts server then runs all API tests
process.env.PORT = '5001';
require('dotenv').config();

const { createServer } = require('http');
const app = require('./src/app');
const socketUtil = require('./src/utils/socket');
const { Server } = require('socket.io');
const prisma = require('./src/config/prisma');

const http = require('http');

const results = [];
const BASE = 'http://localhost:5001/api';
const termId = 'e6812ce4-f542-4895-ac41-6fbbbecc5946';
const branchId = '958f9981-b92d-4237-b2b4-3890466ea622';

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 5001,
      path: '/api' + path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ s: res.statusCode, b: JSON.parse(d) }); }
        catch { resolve({ s: res.statusCode, b: d }); }
      });
    });
    r.on('error', e => resolve({ s: 0, b: e.message }));
    if (bodyStr) r.write(bodyStr);
    r.end();
  });
}

function check(label, status, expected) {
  const ok = expected.includes(status);
  results.push({ label, status, ok });
  console.log(`${ok ? '[PASS]' : '[FAIL]'} ${label} => ${status}`);
  return ok;
}

async function runTests() {
  let adminTok, cashierTok, sessId, orderId;

  console.log('\n=== AUTH ===');
  const email = `admin_${Date.now()}@cafe.com`;
  let r = await req('POST', '/auth/register', { name: 'FinalAdmin', email, password: 'Admin@1234', role: 'ADMIN' });
  check('POST /auth/register (201)', r.s, [201]);

  r = await req('POST', '/auth/login', { email, password: 'Admin@1234' });
  check('POST /auth/login with correct password (200)', r.s, [200]);
  adminTok = r.b.token;

  r = await req('GET', '/auth/me', null, adminTok);
  check('GET /auth/me with valid token (200)', r.s, [200]);

  r = await req('POST', '/auth/login', { email, password: 'WRONG_PWD' });
  check('POST /auth/login wrong password (401)', r.s, [401]);

  r = await req('POST', '/auth/register', { name: 'X', email, password: 'x', role: 'ADMIN' });
  check('POST /auth/register duplicate email (409)', r.s, [409]);

  console.log('\n=== SECURITY ===');
  r = await req('GET', '/orders');
  check('GET /orders without auth (401)', r.s, [401]);

  r = await req('GET', '/auth/me', null, 'BADTOKEN');
  check('GET /auth/me with bad token (401)', r.s, [401]);

  r = await req('GET', '/nonexistent', null, adminTok);
  check('GET /api/nonexistent (404)', r.s, [404]);

  console.log('\n=== TERMINALS ===');
  r = await req('GET', '/terminals', null, adminTok);
  check('GET /terminals (200)', r.s, [200]);

  r = await req('GET', `/terminals/${termId}`, null, adminTok);
  check('GET /terminals/:id (200)', r.s, [200]);

  r = await req('GET', `/terminals/00000000-fake-fake`, null, adminTok);
  check('GET /terminals/:id not-found (404)', r.s, [404]);

  console.log('\n=== PAYMENT SETTINGS ===');
  r = await req('GET', `/payment-settings/${termId}`, null, adminTok);
  check('GET /payment-settings/:termId (200)', r.s, [200]);

  r = await req('PUT', `/payment-settings/${termId}`, { enableCash: true, enableCard: true, enableUpi: true, upiId: 'cafe@upi', upiName: 'Cafe' }, adminTok);
  check('PUT /payment-settings/:termId (200)', r.s, [200]);

  console.log('\n=== CUSTOMERS ===');
  r = await req('GET', '/customers', null, adminTok);
  check('GET /customers (200)', r.s, [200]);

  r = await req('GET', '/customers/top', null, adminTok);
  check('GET /customers/top (200)', r.s, [200]);

  const cEmail = `cust${Date.now()}@cafe.com`;
  const cPhone = String(Date.now()).slice(0, 10);
  r = await req('POST', '/customers', { name: 'Test Customer', email: cEmail, phone: cPhone }, adminTok);
  check('POST /customers (201)', r.s, [201]);
  const custId = r.b.customer?.id;

  if (custId) {
    r = await req('PUT', `/customers/${custId}`, { name: 'Test Customer Updated', phone: cPhone }, adminTok);
    check('PUT /customers/:id (200)', r.s, [200]);
    r = await req('GET', `/customers/${custId}`, null, adminTok);
    check('GET /customers/:id (200)', r.s, [200]);
  }

  console.log('\n=== SESSIONS ===');
  r = await req('GET', '/sessions/active', null, adminTok);
  check('GET /sessions/active (200)', r.s, [200]);

  r = await req('GET', '/sessions/history', null, adminTok);
  check('GET /sessions/history (200)', r.s, [200]);

  r = await req('POST', '/sessions/open', { terminalId: termId, openingCash: 500 }, adminTok);
  check('POST /sessions/open (201 or 409)', r.s, [201, 409]);
  if (r.s === 201) {
    sessId = r.b.session?.id;
  } else {
    const ar = await req('GET', '/sessions/active', null, adminTok);
    sessId = ar.b.sessions?.find(s => s.terminalId === termId)?.id;
    if (!sessId && ar.b.sessions?.length) sessId = ar.b.sessions[0].id;
  }
  console.log(`  Session ID: ${sessId}`);

  r = await req('POST', '/sessions/open', { terminalId: termId, openingCash: 500 }, adminTok);
  check('POST /sessions/open duplicate (409)', r.s, [409]);

  if (sessId) {
    r = await req('GET', `/sessions/${sessId}`, null, adminTok);
    check('GET /sessions/:id (200)', r.s, [200]);
    r = await req('GET', `/sessions/current?terminalId=${termId}`, null, adminTok);
    check('GET /sessions/current (200)', r.s, [200]);
  }

  console.log('\n=== ORDERS ===');
  r = await req('GET', '/orders', null, adminTok);
  check('GET /orders (200)', r.s, [200]);
  r = await req('GET', '/orders/kitchen', null, adminTok);
  check('GET /orders/kitchen (200)', r.s, [200]);

  if (sessId) {
    r = await req('POST', '/orders', { branchId, sessionId: sessId, orderType: 'TAKEAWAY' }, adminTok);
    check('POST /orders TAKEAWAY (201)', r.s, [201]);
    orderId = r.b.order?.id;
    console.log(`  Order ID: ${orderId}`);

    if (orderId) {
      r = await req('GET', `/orders/${orderId}`, null, adminTok);
      check('GET /orders/:id (200)', r.s, [200]);

      r = await req('POST', `/orders/${orderId}/items`, { items: [{ productId: '00000000-0000-0000-0000-000000000001', quantity: 1 }] }, adminTok);
      check('POST /orders/:id/items invalid product (404)', r.s, [404]);

      r = await req('PATCH', `/orders/${orderId}/status`, { status: 'CANCELLED' }, adminTok);
      check('PATCH /orders/:id/status CANCELLED (200)', r.s, [200]);

      r = await req('PATCH', `/orders/${orderId}/status`, { status: 'CREATED' }, adminTok);
      check('PATCH /orders/:id/status invalid transition (400)', r.s, [400]);
    }
  } else {
    results.push({ label: 'ORDER FLOW (SKIPPED - no session)', ok: null });
    console.log('  SKIP order flow');
  }

  console.log('\n=== PAYMENTS ===');
  r = await req('GET', '/payments', null, adminTok);
  check('GET /payments (200)', r.s, [200]);

  r = await req('POST', '/payments/process', { orderId: '00000000-0000-0000-0000-000000000099', method: 'CASH', amount: 100 }, adminTok);
  check('POST /payments/process invalid order (404)', r.s, [404]);

  r = await req('GET', '/payments/receipt/bad-id', null, adminTok);
  check('GET /payments/receipt/:id invalid (404)', r.s, [404]);

  console.log('\n=== SESSION CLOSE ===');
  if (sessId) {
    r = await req('POST', `/sessions/${sessId}/close`, { closingCash: 520 }, adminTok);
    check('POST /sessions/:id/close (200)', r.s, [200]);
    r = await req('POST', `/sessions/${sessId}/close`, { closingCash: 520 }, adminTok);
    check('POST /sessions/:id/close duplicate (400)', r.s, [400]);
    r = await req('GET', `/sessions/current?terminalId=${termId}`, null, adminTok);
    check('GET /sessions/current after close (404)', r.s, [404]);
  }

  console.log('\n=== REPORTS ===');
  r = await req('GET', '/reports/dashboard', null, adminTok);
  check('GET /reports/dashboard (200)', r.s, [200]);
  r = await req('GET', '/reports/sales', null, adminTok);
  check('GET /reports/sales (200)', r.s, [200]);
  if (sessId) {
    r = await req('GET', `/reports/session/${sessId}`, null, adminTok);
    check('GET /reports/session/:id (200)', r.s, [200]);
  }

  console.log('\n=== RBAC (CASHIER) ===');
  const cashEmail = `cashier_${Date.now()}@cafe.com`;
  r = await req('POST', '/auth/register', { name: 'CashierTest', email: cashEmail, password: 'Test@1234', role: 'CASHIER' });
  check('POST /auth/register CASHIER (201)', r.s, [201]);
  r = await req('POST', '/auth/login', { email: cashEmail, password: 'Test@1234' });
  check('POST /auth/login CASHIER (200)', r.s, [200]);
  cashierTok = r.b.token;

  if (cashierTok) {
    r = await req('GET', '/payments', null, cashierTok);
    check('GET /payments as CASHIER (403)', r.s, [403]);
    r = await req('GET', '/reports/sales', null, cashierTok);
    check('GET /reports/sales as CASHIER (403)', r.s, [403]);
    r = await req('GET', '/terminals', null, cashierTok);
    check('GET /terminals as CASHIER (200)', r.s, [200]);
    r = await req('DELETE', `/terminals/${termId}`, null, cashierTok);
    check('DELETE /terminals/:id as CASHIER (403)', r.s, [403]);
    r = await req('POST', '/terminals', { name: 'Hacked', branchId }, cashierTok);
    check('POST /terminals as CASHIER (403)', r.s, [403]);
    r = await req('DELETE', `/customers/${custId || '00000000'}`, null, cashierTok);
    check('DELETE /customers/:id as CASHIER (403)', r.s, [403]);
  }

  const passed  = results.filter(r => r.ok === true).length;
  const failed  = results.filter(r => r.ok === false).length;
  const skipped = results.filter(r => r.ok === null).length;
  console.log(`\n=== FINAL SUMMARY ===`);
  console.log(`Total:   ${results.length}`);
  console.log(`PASSED:  ${passed}`);
  console.log(`FAILED:  ${failed}`);
  console.log(`SKIPPED: ${skipped}`);
  if (failed > 0) {
    console.log('\nFailed:');
    results.filter(r => r.ok === false).forEach(r => console.log(`  - ${r.label} => HTTP ${r.status}`));
  }
  return { passed, failed, skipped, results };
}

async function main() {
  await prisma.$connect();
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });
  socketUtil.init(io);
  io.on('connection', () => {});

  await new Promise(res => httpServer.listen(5001, res));
  console.log('Server started on :5001');

  try {
    const summary = await runTests();
    process.exitCode = summary.failed > 0 ? 1 : 0;
  } finally {
    await prisma.$disconnect();
    httpServer.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
