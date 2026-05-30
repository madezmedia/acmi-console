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
    
    // Expected status range
    if (opts.expectedStatus) {
      assert(res.status === opts.expectedStatus, label, `Expected ${opts.expectedStatus}, got ${res.status}`);
    } else if (opts.expectedRedirect) {
      assert(res.status >= 300 && res.status < 400, label, `Expected redirect, got ${res.status}`);
      if (res.status >= 300 && res.status < 400) {
        assert(res.headers.get('location')?.includes(opts.expectedRedirect) ?? false, `${label} → redirect target`);
      }
    } else {
      // Default: 200 or 401 (unauthorized is OK for unauthed requests)
      assert([200, 201, 401, 404].includes(res.status), label, `Status ${res.status}`);
    }

    // Optional body checks
    if (opts.expectedBodyKey) {
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

  // === AUTH PROTECTED ROUTES ===
  console.log('\n━━━ Protected Routes (expect 401 redirect) ━━━');

  // Admin page requires auth
  await check('GET', '/admin', { noFollow: true, expectedRedirect: '/login' });

  // Create org requires auth
  await check('GET', '/create-org', { noFollow: true, expectedRedirect: '/login' });

  // === API ROUTES (unauthenticated — expect 401) ===
  console.log('\n━━━ API Routes (unauthenticated — expect 401) ━━━');

  // ACMI routes
  await check('GET', '/api/acmi/agent/agent-coordination/timeline?orgId=test', { expectedStatus: 401 });
  await check('GET', '/api/acmi/agent?orgId=test', { expectedStatus: 401 });
  await check('POST', '/api/acmi/event', {
    body: {},
    expectedStatus: 401,
  });
  await check('GET', '/api/acmi/cat?keys=agent:bentley&orgId=test', { expectedStatus: 401 });

  // Supabase CRUD routes
  await check('GET', '/api/db/organizations', { expectedStatus: 401 });
  await check('GET', '/api/db/organizations/test-org', { expectedStatus: 401 });
  await check('GET', '/api/db/organizations/test-org/members', { expectedStatus: 401 });
  await check('GET', '/api/db/organizations/test-org/acmi-config', { expectedStatus: 401 });

  // === API VALIDATION ===
  console.log('\n━━━ API Input Validation ━━━');

  // ACMI event route — missing fields
  await check('POST', '/api/acmi/event', {
    body: { ns: 'agent' },
    expectedStatus: 401, // Auth still gates first
  });

  // === META ===
  console.log('\n━━━ Meta ━━━');

  // Homepage returns HTML
  const res = await fetch(`${BASE_URL}/login`);
  assert(res.ok, `Login page loads (${res.status})`);
  const text = await res.text();
  assert(text.includes('Sign in') || text.includes('clerk') || text.includes('sign-in'),
    'Login page contains Clerk sign-in');

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
