import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const healthCheckDuration = new Trend('health_check_duration', true);
const userApiDuration = new Trend('user_api_duration', true);
const productApiDuration = new Trend('product_api_duration', true);
const orderApiDuration = new Trend('order_api_duration', true);
const totalRequests = new Counter('total_requests');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Load test stages: ramp up → sustained load → ramp down
export const options = {
  stages: [
    { duration: '15s', target: 10 },   // ramp up to 10 users
    { duration: '30s', target: 50 },   // ramp up to 50 users
    { duration: '30s', target: 50 },   // sustain 50 users
    { duration: '15s', target: 100 },  // spike to 100 users
    { duration: '15s', target: 50 },   // scale back to 50
    { duration: '15s', target: 0 },    // ramp down
  ],
  thresholds: {
    // overall p95 under 500ms, p90 under 300ms
    http_req_duration: ['p(95)<500', 'p(90)<300'],
    // custom error rate (excludes expected 404s) under 1%
    error_rate: ['rate<0.01'],
    // health check p95 under 400ms (cloud container headroom)
    health_check_duration: ['p(95)<400'],
    // endpoint p95 under 500ms
    user_api_duration: ['p(95)<500'],
    product_api_duration: ['p(95)<500'],
    order_api_duration: ['p(95)<500'],
  },
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export default function () {
  group('Health Checks', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/health`);
    healthCheckDuration.add(Date.now() - start);
    totalRequests.add(1);

    const ok = check(res, {
      'health status 200': (r) => r.status === 200,
      'health body has UP': (r) => r.json('status') === 'UP',
    });
    errorRate.add(!ok);

    const pingRes = http.get(`${BASE_URL}/api/ping`);
    totalRequests.add(1);
    check(pingRes, {
      'ping status 200': (r) => r.status === 200,
      'ping returns pong': (r) => r.json('message') === 'pong',
    });
  });

  sleep(0.2);

  group('Users API', () => {
    // List all users
    const start = Date.now();
    const listRes = http.get(`${BASE_URL}/api/users`);
    userApiDuration.add(Date.now() - start);
    totalRequests.add(1);

    const listOk = check(listRes, {
      'list users 200': (r) => r.status === 200,
      'list users is array': (r) => Array.isArray(r.json()),
      'list users not empty': (r) => r.json().length > 0,
    });
    errorRate.add(!listOk);

    // Get user by ID
    const s2 = Date.now();
    const getRes = http.get(`${BASE_URL}/api/users/1`);
    userApiDuration.add(Date.now() - s2);
    totalRequests.add(1);

    check(getRes, {
      'get user 200': (r) => r.status === 200,
      'get user has id': (r) => r.json('id') === 1,
      'get user has name': (r) => r.json('name') !== undefined,
    });

    // Get non-existent user
    const s3 = Date.now();
    const notFoundRes = http.get(`${BASE_URL}/api/users/9999`);
    userApiDuration.add(Date.now() - s3);
    totalRequests.add(1);

    check(notFoundRes, {
      'missing user returns 404': (r) => r.status === 404,
    });

    // Create a new user
    const s4 = Date.now();
    const createRes = http.post(
      `${BASE_URL}/api/users`,
      JSON.stringify({ name: 'Load Test User', email: 'loadtest@example.com', role: 'USER' }),
      { headers: JSON_HEADERS }
    );
    userApiDuration.add(Date.now() - s4);
    totalRequests.add(1);

    check(createRes, {
      'create user 201': (r) => r.status === 201,
      'create user has id': (r) => r.json('id') !== undefined,
    });
  });

  sleep(0.2);

  group('Products API', () => {
    // List all products
    const s1 = Date.now();
    const listRes = http.get(`${BASE_URL}/api/products`);
    productApiDuration.add(Date.now() - s1);
    totalRequests.add(1);

    const listOk = check(listRes, {
      'list products 200': (r) => r.status === 200,
      'list products is array': (r) => Array.isArray(r.json()),
      'list products not empty': (r) => r.json().length > 0,
    });
    errorRate.add(!listOk);

    // Filter by category
    const s2 = Date.now();
    const catRes = http.get(`${BASE_URL}/api/products?category=Electronics`);
    productApiDuration.add(Date.now() - s2);
    totalRequests.add(1);

    check(catRes, {
      'filter by category 200': (r) => r.status === 200,
      'filter returns electronics': (r) => r.json().every(p => p.category === 'Electronics'),
    });

    // Get product by ID
    const s3 = Date.now();
    const getRes = http.get(`${BASE_URL}/api/products/1`);
    productApiDuration.add(Date.now() - s3);
    totalRequests.add(1);

    check(getRes, {
      'get product 200': (r) => r.status === 200,
      'get product has price': (r) => r.json('price') > 0,
    });
  });

  sleep(0.2);

  group('Orders API', () => {
    // List all orders
    const s1 = Date.now();
    const listRes = http.get(`${BASE_URL}/api/orders`);
    orderApiDuration.add(Date.now() - s1);
    totalRequests.add(1);

    const listOk = check(listRes, {
      'list orders 200': (r) => r.status === 200,
      'list orders is array': (r) => Array.isArray(r.json()),
    });
    errorRate.add(!listOk);

    // Get orders by user
    const s2 = Date.now();
    const userOrdersRes = http.get(`${BASE_URL}/api/orders/user/1`);
    orderApiDuration.add(Date.now() - s2);
    totalRequests.add(1);

    check(userOrdersRes, {
      'user orders 200': (r) => r.status === 200,
      'user orders is array': (r) => Array.isArray(r.json()),
    });

    // Create a new order
    const s3 = Date.now();
    const createRes = http.post(
      `${BASE_URL}/api/orders`,
      JSON.stringify({ userId: 1, productId: 3, quantity: 2, totalPrice: 99.98, status: 'PENDING' }),
      { headers: JSON_HEADERS }
    );
    orderApiDuration.add(Date.now() - s3);
    totalRequests.add(1);

    check(createRes, {
      'create order 201': (r) => r.status === 201,
      'create order has id': (r) => r.json('id') !== undefined,
      'create order status PENDING': (r) => r.json('status') === 'PENDING',
    });
  });

  sleep(0.3);
}

export function handleSummary(data) {
  return {
    'results/k6-summary.json': JSON.stringify(data, null, 2),
    stdout: generateTextReport(data),
  };
}

function fmt(val, decimals) {
  return val != null ? val.toFixed(decimals != null ? decimals : 2) : 'N/A';
}

function generateTextReport(data) {
  const metrics = data.metrics;
  const duration = metrics.http_req_duration;
  const checks = metrics.checks;
  const reqs = metrics.http_reqs;
  const dv = duration ? duration.values : null;
  const checksRate = checks ? fmt(checks.values.rate * 100) : 'N/A';
  const errRate = metrics.error_rate ? fmt(metrics.error_rate.values.rate * 100, 4) : '0.0000';

  return `
╔══════════════════════════════════════════════════════════════════╗
║           k6 Load Test Summary — Java Web Service               ║
╚══════════════════════════════════════════════════════════════════╝

  RESPONSE TIME (ms)
  ─────────────────────────────────────────────────────────
  Min          : ${dv ? fmt(dv['min']) : 'N/A'} ms
  Avg          : ${dv ? fmt(dv['avg']) : 'N/A'} ms
  p50 (median) : ${dv ? fmt(dv['med']) : 'N/A'} ms
  p90          : ${dv ? fmt(dv['p(90)']) : 'N/A'} ms
  p95          : ${dv ? fmt(dv['p(95)']) : 'N/A'} ms
  p99          : ${dv ? fmt(dv['p(99)'] != null ? dv['p(99)'] : dv['p(95)']) : 'N/A'} ms
  Max          : ${dv ? fmt(dv['max']) : 'N/A'} ms

  THROUGHPUT
  ─────────────────────────────────────────────────────────
  Total Requests : ${reqs ? reqs.values.count : 0}
  Req/sec        : ${reqs ? fmt(reqs.values.rate) : 'N/A'}

  RELIABILITY
  ─────────────────────────────────────────────────────────
  Checks Passed  : ${checksRate}%
  Error Rate     : ${errRate}%

  ENDPOINT-LEVEL p95 (ms)
  ─────────────────────────────────────────────────────────
  Health Check   : ${metrics.health_check_duration ? fmt(metrics.health_check_duration.values['p(95)']) : 'N/A'} ms
  Users API      : ${metrics.user_api_duration ? fmt(metrics.user_api_duration.values['p(95)']) : 'N/A'} ms
  Products API   : ${metrics.product_api_duration ? fmt(metrics.product_api_duration.values['p(95)']) : 'N/A'} ms
  Orders API     : ${metrics.order_api_duration ? fmt(metrics.order_api_duration.values['p(95)']) : 'N/A'} ms
══════════════════════════════════════════════════════════════════
`;
}
