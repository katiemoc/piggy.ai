import express from 'express';

const router = express.Router();

// ── Fake CSV data ────────────────────────────────────────────────────────────

const CSV_FILES = {
  'january_2026.csv': `date,description,amount,type,category
2026-01-03,Paycheck Direct Deposit,4200.00,credit,Income
2026-01-05,Whole Foods Market,-89.45,debit,Food & Dining
2026-01-07,Netflix,-15.99,debit,Subscriptions
2026-01-09,Shell Gas Station,-52.10,debit,Transport
2026-01-11,Amazon Purchase,-134.00,debit,Shopping
2026-01-14,Spotify,-9.99,debit,Subscriptions
2026-01-15,Restaurant - Chipotle,-14.75,debit,Food & Dining
2026-01-18,Uber,-12.40,debit,Transport
2026-01-20,Target,-67.23,debit,Shopping
2026-01-22,Starbucks,-6.85,debit,Food & Dining
2026-01-24,Rent Payment,-1500.00,debit,Housing
2026-01-28,Freelance Payment,800.00,credit,Income
2026-01-30,Electric Bill,-98.00,debit,Utilities`,

  'february_2026.csv': `date,description,amount,type,category
2026-02-01,Paycheck Direct Deposit,4200.00,credit,Income
2026-02-03,Trader Joes,-72.30,debit,Food & Dining
2026-02-05,Hulu,-17.99,debit,Subscriptions
2026-02-07,Chevron Gas,-48.60,debit,Transport
2026-02-10,Apple Store,-29.99,debit,Shopping
2026-02-12,DoorDash,-34.50,debit,Food & Dining
2026-02-14,Valentine Dinner,-95.00,debit,Food & Dining
2026-02-16,Lyft,-18.75,debit,Transport
2026-02-18,Costco,-210.44,debit,Shopping
2026-02-20,Starbucks,-5.75,debit,Food & Dining
2026-02-22,Rent Payment,-1500.00,debit,Housing
2026-02-25,Side Project Payment,1200.00,credit,Income
2026-02-28,Internet Bill,-59.99,debit,Utilities`,
};

// ── Shared styles ─────────────────────────────────────────────────────────────

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f0; color: #1a1a1a; min-height: 100vh; }
  .topbar { background: #57886c; color: white; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
  .topbar h1 { font-size: 20px; font-weight: 600; letter-spacing: -0.3px; }
  .topbar span { font-size: 13px; opacity: 0.85; }
  .topbar a { color: white; text-decoration: none; font-size: 13px; opacity: 0.85; }
  .topbar a:hover { opacity: 1; text-decoration: underline; }
  .container { max-width: 800px; margin: 40px auto; padding: 0 20px; }
  .card { background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 32px; margin-bottom: 24px; }
  h2 { font-size: 22px; font-weight: 600; margin-bottom: 4px; }
  .subtitle { color: #5a5a5a; font-size: 14px; margin-bottom: 28px; }
  label { display: block; font-size: 14px; color: #1a1a1a; margin-bottom: 6px; font-weight: 500; }
  input[type=text], input[type=password] {
    width: 100%; padding: 10px 14px; border: 1px solid #d0d0d0; border-radius: 8px;
    font-size: 14px; margin-bottom: 18px; outline: none; transition: border-color 0.15s;
  }
  input[type=text]:focus, input[type=password]:focus { border-color: #57886c; }
  button[type=submit], .btn {
    display: inline-block; background: #57886c; color: white; border: none;
    padding: 11px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;
    cursor: pointer; text-decoration: none; transition: background 0.15s;
  }
  button[type=submit]:hover, .btn:hover { background: #466060; }
  .btn-outline {
    background: transparent; border: 2px solid #57886c; color: #57886c;
    padding: 9px 22px;
  }
  .btn-outline:hover { background: #57886c; color: white; }
  .error { background: #fde8e8; border: 1px solid #f5c6c6; color: #c0392b; padding: 12px 16px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; }
  .nav { display: flex; gap: 12px; margin-bottom: 28px; }
  .account-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 8px; }
  .account-card { background: #f5f5f0; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; }
  .account-card .acct-type { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #5a5a5a; margin-bottom: 6px; }
  .account-card .acct-number { font-size: 13px; color: #5a5a5a; margin-bottom: 12px; }
  .account-card .balance { font-size: 28px; font-weight: 700; color: #57886c; }
  .account-card .balance-label { font-size: 12px; color: #5a5a5a; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 10px 14px; border-bottom: 2px solid #e0e0e0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px; color: #5a5a5a; }
  td { padding: 14px; border-bottom: 1px solid #f0f0f0; }
  tr:last-child td { border-bottom: none; }
  .download-link { color: #57886c; font-weight: 600; text-decoration: none; font-size: 13px; }
  .download-link:hover { text-decoration: underline; }
  .badge { display: inline-block; background: #57886c/15; color: #57886c; font-size: 11px; padding: 2px 8px; border-radius: 20px; background: #e8f0eb; }
`;

const topbar = (user) => `
  <div class="topbar">
    <h1>🏦 Demo Bank</h1>
    <span>Welcome, ${user} &nbsp;|&nbsp; <a href="/mock-bank/login" id="logout-link">Log out</a></span>
  </div>`;

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /mock-bank/login
router.get('/login', (req, res) => {
  const error = req.query.error ? '<div class="error" id="login-error">Invalid username or password. Try demo_user / demo_pass.</div>' : '';
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Demo Bank – Login</title><style>${css}</style></head>
<body>
  <div class="topbar"><h1>🏦 Demo Bank</h1><span>Secure Online Banking</span></div>
  <div class="container" style="max-width:440px">
    <div class="card">
      <h2>Sign in</h2>
      <p class="subtitle">Enter your online banking credentials</p>
      ${error}
      <form method="POST" action="/mock-bank/login" id="login-form">
        <label for="username">Username</label>
        <input id="username" name="username" type="text" placeholder="Enter username" autocomplete="username" />
        <label for="password">Password</label>
        <input id="password" name="password" type="password" placeholder="Enter password" autocomplete="current-password" />
        <button type="submit" id="login-button">Sign In</button>
      </form>
      <p style="margin-top:18px;font-size:13px;color:#5a5a5a;">Demo credentials: <strong>demo_user</strong> / <strong>demo_pass</strong></p>
    </div>
  </div>
</body>
</html>`);
});

// POST /mock-bank/login
router.post('/login', express.urlencoded({ extended: false }), (req, res) => {
  const { username, password } = req.body;
  if (username === 'demo_user' && password === 'demo_pass') {
    res.redirect(`/mock-bank/dashboard?user=${encodeURIComponent(username)}`);
  } else {
    res.redirect('/mock-bank/login?error=1');
  }
});

// GET /mock-bank/dashboard
router.get('/dashboard', (req, res) => {
  const user = req.query.user || 'demo_user';
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Demo Bank – Dashboard</title><style>${css}</style></head>
<body>
  ${topbar(user)}
  <div class="container">
    <div class="card">
      <h2>Account Overview</h2>
      <p class="subtitle">Your accounts as of April 2026</p>
      <div class="account-grid">
        <div class="account-card" id="checking-account">
          <div class="acct-type">Checking</div>
          <div class="acct-number">••••4821</div>
          <div class="balance" id="checking-balance">$3,241.55</div>
          <div class="balance-label">Available balance</div>
        </div>
        <div class="account-card" id="savings-account">
          <div class="acct-type">Savings</div>
          <div class="acct-number">••••9037</div>
          <div class="balance" id="savings-balance">$12,480.00</div>
          <div class="balance-label">Available balance</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Quick Actions</h2>
      <p class="subtitle">What would you like to do?</p>
      <div class="nav">
        <a href="/mock-bank/statements?user=${encodeURIComponent(user)}" class="btn" id="view-statements-button">View Statements</a>
        <a href="/mock-bank/dashboard?user=${encodeURIComponent(user)}" class="btn btn-outline" id="refresh-button">Refresh</a>
      </div>
    </div>

    <div class="card">
      <h2>Recent Transactions</h2>
      <p class="subtitle">Last 5 transactions across all accounts</p>
      <table id="recent-transactions">
        <thead>
          <tr><th>Date</th><th>Description</th><th>Amount</th><th>Type</th></tr>
        </thead>
        <tbody>
          <tr><td>Apr 3, 2026</td><td>Paycheck Direct Deposit</td><td style="color:#57886c">+$4,200.00</td><td><span class="badge">Credit</span></td></tr>
          <tr><td>Apr 2, 2026</td><td>Whole Foods Market</td><td style="color:#c0392b">-$89.45</td><td><span class="badge">Debit</span></td></tr>
          <tr><td>Apr 1, 2026</td><td>Netflix</td><td style="color:#c0392b">-$15.99</td><td><span class="badge">Debit</span></td></tr>
          <tr><td>Mar 30, 2026</td><td>Shell Gas Station</td><td style="color:#c0392b">-$52.10</td><td><span class="badge">Debit</span></td></tr>
          <tr><td>Mar 28, 2026</td><td>Freelance Payment</td><td style="color:#57886c">+$800.00</td><td><span class="badge">Credit</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`);
});

// GET /mock-bank/statements
router.get('/statements', (req, res) => {
  const user = req.query.user || 'demo_user';
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Demo Bank – Statements</title><style>${css}</style></head>
<body>
  ${topbar(user)}
  <div class="container">
    <div class="card">
      <h2>Statements</h2>
      <p class="subtitle">Download your monthly statements as CSV files</p>
      <div class="nav">
        <a href="/mock-bank/dashboard?user=${encodeURIComponent(user)}" class="btn btn-outline" id="back-to-dashboard">← Dashboard</a>
      </div>
      <table id="statements-table">
        <thead>
          <tr><th>Period</th><th>Account</th><th>Transactions</th><th>File</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr id="statement-jan">
            <td>January 2026</td>
            <td>Checking ••••4821</td>
            <td>13 transactions</td>
            <td>january_2026.csv</td>
            <td><a href="/mock-bank/download/january_2026.csv" class="download-link" id="download-january">Download CSV</a></td>
          </tr>
          <tr id="statement-feb">
            <td>February 2026</td>
            <td>Checking ••••4821</td>
            <td>13 transactions</td>
            <td>february_2026.csv</td>
            <td><a href="/mock-bank/download/february_2026.csv" class="download-link" id="download-february">Download CSV</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`);
});

// GET /mock-bank/download/:filename
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const content = CSV_FILES[filename];
  if (!content) {
    return res.status(404).send('File not found');
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(content);
});

// Redirect /mock-bank root → login
router.get('/', (req, res) => res.redirect('/mock-bank/login'));

export default router;
