#!/usr/bin/env node

/**
 * ACMI Console — QA Test Suite
 * 
 * Runs against the live deployment to verify every route responds correctly.
 * Usage: node tests/qa/runner.mjs --base-url https://acmi-console.vercel.app
 */

const BASE_URL = process.argv.find(a => a.startsWith('--base-url='))?.split('=')[1]
  || process.env.BASE_URL
  || 'http://localhost:3000';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label, detail = '') {
  if (condition) {
    passed++;
    process.stdout.write('✅');
  } else {
    failed++;
    process.stdout.write('❌');
    failures.push({ label, detail });
  }
  console.log(` ${label}`);
}

async function check(method, path, opts = {}) {
  const url = `${BASE_URL}${path}`;
  const label = `${method} ${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
      redirect: opts.noFollow ? 'manual' : 'follow',
    });
    
    if (opts.expectedStatus !== undefined) {
      assert(res.status === opts.expectedStatus, label, `Expected ${opts.expectedStatus}, got ${res.status}`);
    } else if (opts.expectedRedirect) {
      const ok = res.status >= 300 && res.status < 400
        && res.headers.get('location')?.includes(opts.expectedRedirect);
      assert(ok, label, `Expected redirect to ${opts.expectedRedirect}, got ${res.status} ${res.headers.get('location')}`);
    } else {
      assert(res.ok, label, `Status ${res.status}`);
    }

    if (opts.expectedBodyKey && res.ok) {
      const body = await res.json();
      assert(body[opts.expectedBodyKey] !== undefined, label, `Has key "${opts.expectedBodyKey}"`);
    }
  } catch (e) {
    assert(false, label, `Network error: ${e.message}`);
  }
}

async function main() {
  console.log(`\n🧪 ACMI Console QA Suite\n`);
  console.log(`Target: ${BASE_URL}\n`);

  // === PUBLIC ROUTES ===
  console.log('━━━ Public Routes ━━━');

  // Login page loads
  await check('GET', '/login', { expectedStatus: 200 });

  // Root page redirects unauthenticated to /login
  await check('GET', '/', { noFollow: true, expectedRedirect: '/login' });

  // Login page contains Clerk sign-in
  const loginRes = await fetch(`${BASE_URL}/login`);
  const loginText = await loginRes.text();
  assert(loginText.includes('sign-in') || loginText.includes('Sign in') || loginText.includes('clerk'),
    'Login page contains Clerk sign-in UI');

  // === PROTECTED PAGES ===
  console.log('\n━━━ Protected Pages (expect redirect when unauthenticated) ━━━');

  // Admin requires auth → redirects to our login page
  await check('GET', '/admin', { noFollow: true, expectedRedirect: '/login' });

  // Create org — Clerk CreateOrganization handles auth inline, so 200 is correct
  await check('GET', '/create-org', { expectedStatus: 200 });

  // === API ROUTES (unauthenticated — expect 401) ===
  console.log('\n━━━ API Routes (unauthenticated — expect 401) ━━━');

  // ACMI routes
  await check('GET', '/api/acmi/agent?orgId=test', { expectedStatus: 401 });
  await check('POST', '/api/acmi/event', { body: {}, expectedStatus: 401 });
  await check('GET', '/api/acmi/cat?keys=agent:bentley&orgId=test', { expectedStatus: 401 });

  // ACMI single entity route — returns 404 if org not found (valid response, not a crash)
  await check('GET', '/api/acmi/agent/bentley/timeline?orgId=test', { expectedStatus: 404 });

  // Supabase CRUD routes
  await check('GET', '/api/db/organizations', { expectedStatus: 401 });
  await check('GET', '/api/db/organizations/test-org', { expectedStatus: 401 });
  await check('GET', '/api/db/organizations/test-org/members', { expectedStatus: 401 });
  await check('GET', '/api/db/organizations/test-org/acmi-config', { expectedStatus: 401 });

  // === WEBHOOK ENDPOINT ===
  console.log('\n━━━ Webhook Endpoint ━━━');
  
  // Missing svix headers → 400
  const whRes = await fetch(`${BASE_URL}/api/auth/webhook`, { method: 'POST' });
  assert(whRes.status === 400, 'POST /api/auth/webhook — missing svix headers returns 400');

  // === SUMMARY ===
  const total = passed + failed;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`Results: ${passed}/${total} passed`);

  if (failures.length > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) {
      console.log(`  ❌ ${f.label}${f.detail ? ` — ${f.detail}` : ''}`);
    }
    process.exit(1);
  } else {
    console.log('✅ All checks passed.');
    process.exit(0);
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
