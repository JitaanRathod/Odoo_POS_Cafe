const https = require('http');
const BASE = 'http://localhost:5001/api';

const results = [];
let ADMIN_TOKEN = null;
let CASHIER_TOKEN = null;
let sessId = null;
let orderId = null;
const termId = 'e6812ce4-f542-4895-ac41-6fbbbecc5946';
const branchId = '958f9981-b92d-4237-b2b4-3890466ea622';

function request(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function pass(label, status, expected) {
  const ok = expected.includes(status);
  const icon = ok ? '[PASS]' : '[FAIL]';
  const note = ok ? '' : ` (expected ${expected.join('/')}, got ${status})`;
  results.push({ label, status, ok });
  console.log(`${icon} ${label} => ${status}${note}`);
}

async function run() {
  let r;

  console.log('\n=== AUTH ===');
  // Fresh register
  r = await request('POST', '/auth/register', { name: 'FinalAdmin', email: `final_admin_${Date.now()}@cafe.com`, password: 'Final@1234', role: 'ADMIN' });
  const adminEmail = `final_admin_${Date.now() - 1}@cafe.com`;
  pass('POST /auth/register (201)', r.status, [201]);

  r = await request('POST', '/auth/login', { email: r.body.user?.email || adminEmail, password: 'Final@1234' });
  pass('POST /auth/login (200)', r.status, [200]);
  ADMIN_TOKEN = r.body.token;

  r = await request('GET', '/auth/me', null, ADMIN_TOKEN);
  pass('GET /auth/me (200)', r.status, [200]);

  // Bad credentials
  r = await request('POST', '/auth/login', { email: 'nobody@x.com', password: 'wrong' });
  pass('POST /auth/login wrong credentials (401)', r.status, [401]);

  // Duplicate register
  r = await request('POST', '/auth/register', { name: 'X', email: 'final_admin@same.com', password: 'x', role: 'ADMIN' });
  // first register
  r = await request('POST', '/auth/register', { name: 'X', email: 'final_admin@same.com', password: 'x', role: 'ADMIN' });
  pass('POST /auth/register duplicate (409)', r.status, [409]);

  console.log('\n=== SECURITY ===');
  r = await request('GET', '/orders');
  pass('GET /orders no-auth (401)', r.status, [401]);

  r = await request('GET', '/auth/me', null, 'BAD_TOKEN');
  pass('GET /auth/me bad-token (401)', r.status, [401]);

  r = await request('GET', '/nonexistent', null, ADMIN_TOKEN);
  pass('GET /nonexistent (404)', r.status, [404]);

  console.log('\n=== TERMINALS ===');
  r = await request('GET', '/terminals', null, ADMIN_TOKEN);
  pass('GET /terminals (200)', r.status, [200]);

  r = await request('GET', `/terminals/${termId}`, null, ADMIN_TOKEN);
  pass('GET /terminals/:id (200)', r.status, [200]);

  console.log('\n=== PAYMENT SETTINGS ===');
  r = await request('GET', `/payment-settings/${termId}`, null, ADMIN_TOKEN);
  pass('GET /payment-settings/:termId (200)', r.status, [200]);

  r = await request('PUT', `/payment-settings/${termId}`, { enableCash: true, enableCard: true, enableUpi: true, upiId: 'test@upi', upiName: 'Test Cafe' }, ADMIN_TOKEN);
  pass('PUT /payment-settings/:termId (200)', r.status, [200]);

  console.log('\n=== CUSTOMERS ===');
  r = await request('GET', '/customers', null, ADMIN_TOKEN);
  pass('GET /customers (200)', r.status, [200]);

  r = await request('GET', '/customers/top', null, ADMIN_TOKEN);
  pass('GET /customers/top (200)', r.status, [200]);

  const uid = Date.now();
  r = await request('POST', '/customers', { name: 'Test Cust', email: `tc${uid}@cafe.com`, phone: `91${uid}`.slice(0,12) }, ADMIN_TOKEN);
  pass('POST /customers (201)', r.status, [201]);
  const custId = r.body.customer?.id;

  if (custId) {
    r = await request('PUT', `/customers/${custId}`, { name: 'Test Cust Updated', phone: `91${uid}`.slice(0,12) }, ADMIN_TOKEN);
    pass('PUT /customers/:id (200)', r.status, [200]);

    r = await request('GET', `/customers/${custId}`, null, ADMIN_TOKEN);
    pass('GET /customers/:id (200)', r.status, [200]);
  }

  console.log('\n=== SESSIONS ===');
  r = await request('GET', '/sessions/active', null, ADMIN_TOKEN);
  pass('GET /sessions/active (200)', r.status, [200]);

  r = await request('GET', '/sessions/history', null, ADMIN_TOKEN);
  pass('GET /sessions/history (200)', r.status, [200]);

  // Open session
  r = await request('POST', '/sessions/open', { terminalId: termId, openingCash: 500 }, ADMIN_TOKEN);
  pass('POST /sessions/open (201)', r.status, [201, 409]);
  if (r.status === 201) {
    sessId = r.body.session?.id;
  } else {
    // fetch active
    const ar = await request('GET', '/sessions/active', null, ADMIN_TOKEN);
    sessId = ar.body.sessions?.find(s => s.terminalId === termId)?.id || ar.body.sessions?.[0]?.id;
  }
  console.log(`  Session: ${sessId}`);

  // Duplicate open
  r = await request('POST', '/sessions/open', { terminalId: termId, openingCash: 500 }, ADMIN_TOKEN);
  pass('POST /sessions/open duplicate (409)', r.status, [409]);

  if (sessId) {
    r = await request('GET', `/sessions/${sessId}`, null, ADMIN_TOKEN);
    pass('GET /sessions/:id (200)', r.status, [200]);

    r = await request('GET', `/sessions/current?terminalId=${termId}`, null, ADMIN_TOKEN);
    pass('GET /sessions/current (200)', r.status, [200]);
  }

  console.log('\n=== ORDERS ===');
  r = await request('GET', '/orders', null, ADMIN_TOKEN);
  pass('GET /orders (200)', r.status, [200]);

  r = await request('GET', '/orders/kitchen', null, ADMIN_TOKEN);
  pass('GET /orders/kitchen (200)', r.status, [200]);

  if (sessId) {
    r = await request('POST', '/orders', { branchId, sessionId: sessId, orderType: 'TAKEAWAY' }, ADMIN_TOKEN);
    pass('POST /orders TAKEAWAY (201)', r.status, [201]);
    orderId = r.body.order?.id;
    console.log(`  Order: ${orderId}`);

    if (orderId) {
      r = await request('GET', `/orders/${orderId}`, null, ADMIN_TOKEN);
      pass('GET /orders/:id (200)', r.status, [200]);

      r = await request('POST', `/orders/${orderId}/items`, { items: [{ productId: '00000000-0000-0000-0000-000000000001', quantity: 1 }] }, ADMIN_TOKEN);
      pass('POST /orders/:id/items invalid product (404)', r.status, [404]);

      r = await request('PATCH', `/orders/${orderId}/status`, { status: 'CANCELLED' }, ADMIN_TOKEN);
      pass('PATCH /orders/:id/status CANCELLED (200)', r.status, [200]);
    }
  } else {
    console.log('  SKIP order flow - no session');
    results.push({ label: 'POST /orders (SKIPPED)', status: 'N/A', ok: null });
  }

  console.log('\n=== PAYMENTS ===');
  r = await request('GET', '/payments', null, ADMIN_TOKEN);
  pass('GET /payments (200)', r.status, [200]);

  r = await request('POST', '/payments/process', { orderId: '00000000-0000-0000-0000-000000000099', method: 'CASH', amount: 100 }, ADMIN_TOKEN);
  pass('POST /payments/process invalid order (404)', r.status, [404]);

  r = await request('GET', '/payments/receipt/bad-id', null, ADMIN_TOKEN);
  pass('GET /payments/receipt/:id invalid (404)', r.status, [404]);

  console.log('\n=== SESSION CLOSE ===');
  if (sessId) {
    r = await request('POST', `/sessions/${sessId}/close`, { closingCash: 520 }, ADMIN_TOKEN);
    pass('POST /sessions/:id/close (200)', r.status, [200]);

    r = await request('POST', `/sessions/${sessId}/close`, { closingCash: 520 }, ADMIN_TOKEN);
    pass('POST /sessions/:id/close duplicate (400)', r.status, [400]);

    r = await request('GET', `/sessions/current?terminalId=${termId}`, null, ADMIN_TOKEN);
    pass('GET /sessions/current after close (404)', r.status, [404]);
  }

  console.log('\n=== REPORTS ===');
  r = await request('GET', '/reports/dashboard', null, ADMIN_TOKEN);
  pass('GET /reports/dashboard (200)', r.status, [200]);

  r = await request('GET', '/reports/sales', null, ADMIN_TOKEN);
  pass('GET /reports/sales (200)', r.status, [200]);

  if (sessId) {
    r = await request('GET', `/reports/session/${sessId}`, null, ADMIN_TOKEN);
    pass('GET /reports/session/:id (200)', r.status, [200]);
  }

  console.log('\n=== RBAC (CASHIER) ===');
  const cashEmail = `cashier_rbac_${Date.now()}@cafe.com`;
  r = await request('POST', '/auth/register', { name: 'CashierRBAC', email: cashEmail, password: 'Test@1234', role: 'CASHIER' });
  pass('POST /auth/register CASHIER (201)', r.status, [201]);

  r = await request('POST', '/auth/login', { email: cashEmail, password: 'Test@1234' });
  pass('POST /auth/login CASHIER (200)', r.status, [200]);
  CASHIER_TOKEN = r.body.token;

  if (CASHIER_TOKEN) {
    r = await request('GET', '/payments', null, CASHIER_TOKEN);
    pass('GET /payments as CASHIER (403)', r.status, [403]);

    r = await request('GET', '/reports/sales', null, CASHIER_TOKEN);
    pass('GET /reports/sales as CASHIER (403)', r.status, [403]);

    r = await request('GET', '/terminals', null, CASHIER_TOKEN);
    pass('GET /terminals as CASHIER (200)', r.status, [200]);

    r = await request('DELETE', `/terminals/${termId}`, null, CASHIER_TOKEN);
    pass('DELETE /terminals/:id as CASHIER (403)', r.status, [403]);

    r = await request('POST', '/terminals', { name: 'Hacked Terminal', branchId }, CASHIER_TOKEN);
    pass('POST /terminals as CASHIER (403)', r.status, [403]);
  }

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.ok === true).length;
  const failed = results.filter(r => r.ok === false).length;
  const skipped = results.filter(r => r.ok === null).length;
  console.log(`Total tests: ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`SKIPPED: ${skipped}`);
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.ok === false).forEach(r => console.log(`  - ${r.label} => HTTP ${r.status}`));
  }
}

run().catch(console.error);
