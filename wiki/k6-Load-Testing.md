# k6 Load Testing

## Overview

The k6 script (`k6/load-test.js`) applies a multi-stage VU (virtual user) ramp against the Java service, validates responses with `check()` assertions, records per-endpoint latency with custom `Trend` metrics, and enforces pass/fail thresholds.

**Tool version:** Grafana k6 v0.54.0

---

## Load Profile (Stages)

```
VUs
100 |                   ████
 50 |          █████████    █████
 10 |    ██████                   
  0 |────|────|────|────|────|────→ time
     0s  15s  45s  75s  90s  105s 120s
```

| Stage | Duration | Target VUs | Purpose |
|-------|----------|-----------|---------|
| 1 | 15 s | 10 | Warm-up ramp |
| 2 | 30 s | 50 | Moderate load ramp |
| 3 | 30 s | 50 | Sustained load |
| 4 | 15 s | 100 | Spike / peak stress |
| 5 | 15 s | 50 | Recovery ramp-down |
| 6 | 15 s | 0 | Cool-down |

---

## Test Groups

Each VU iteration executes four sequential groups with short sleeps between them:

```
┌─ Health Checks
│   GET /api/health       → assert status=200, body.status="UP"
│   GET /api/ping         → assert status=200, body.message="pong"
│
├─ Users API
│   GET /api/users        → assert 200, is array, not empty
│   GET /api/users/1      → assert 200, id=1, name present
│   GET /api/users/9999   → assert 404 (expected not-found)
│   POST /api/users       → assert 201, id present
│
├─ Products API
│   GET /api/products     → assert 200, is array, not empty
│   GET /api/products?category=Electronics → assert all items are Electronics
│   GET /api/products/1   → assert 200, price > 0
│
└─ Orders API
    GET /api/orders        → assert 200, is array
    GET /api/orders/user/1 → assert 200, is array
    POST /api/orders       → assert 201, id present, status=PENDING
```

---

## Custom Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `error_rate` | Rate | Tracks group-level check failures (excludes intentional 404s) |
| `health_check_duration` | Trend | Latency of health check requests |
| `user_api_duration` | Trend | Latency of user API requests |
| `product_api_duration` | Trend | Latency of product API requests |
| `order_api_duration` | Trend | Latency of order API requests |
| `total_requests` | Counter | Total number of HTTP requests made |

---

## Thresholds

All thresholds must pass for the test to exit with code `0`:

| Threshold | Limit | Meaning |
|-----------|-------|---------|
| `http_req_duration p(95)` | < 500 ms | 95% of requests complete under 500 ms |
| `http_req_duration p(90)` | < 300 ms | 90% of requests complete under 300 ms |
| `error_rate` | < 1% | Custom error rate under 1% |
| `health_check_duration p(95)` | < 400 ms | Health checks p95 under 400 ms |
| `user_api_duration p(95)` | < 500 ms | User endpoints p95 under 500 ms |
| `product_api_duration p(95)` | < 500 ms | Product endpoints p95 under 500 ms |
| `order_api_duration p(95)` | < 500 ms | Order endpoints p95 under 500 ms |

A threshold violation causes k6 to exit with code `99` (useful for CI fail gates).

---

## Running the Test

### Basic run

```bash
cd k6
k6 run load-test.js
```

### Custom target host

```bash
k6 run -e BASE_URL=http://staging-server:8080 load-test.js
```

### Output to InfluxDB + Grafana

```bash
k6 run --out influxdb=http://localhost:8086/k6 load-test.js
```

### Output to Prometheus (remote write)

```bash
k6 run --out experimental-prometheus-rw load-test.js
```

---

## Output Files

| File | Description |
|------|-------------|
| `results/k6-summary.json` | Full metrics summary as JSON (written by `handleSummary`) |
| stdout | Formatted text report with response time percentiles and endpoint breakdown |

---

## Understanding `http_req_failed`

k6 marks **any non-2xx response** as a failed HTTP request in the built-in `http_req_failed` metric. This includes the intentional `GET /api/users/9999` → `404` in the Users API group. The **custom `error_rate` metric** excludes these expected 404s and tracks only real application failures, which remained at **0.00%** throughout all test runs.

---

## CI Integration Example

```yaml
# GitHub Actions excerpt
- name: Install k6
  run: |
    curl -fsSL https://github.com/grafana/k6/releases/download/v0.54.0/k6-v0.54.0-linux-amd64.tar.gz \
      | tar -xz -C /usr/local/bin --strip-components=1

- name: Run k6 load test
  run: k6 run k6/load-test.js

- name: Upload k6 summary
  uses: actions/upload-artifact@v4
  with:
    name: k6-results
    path: k6/results/k6-summary.json
```
