# JMeter Load Testing

## Overview

The JMeter test plan (`jmeter/load-test-plan.jmx`) exercises all API endpoints using four concurrent thread groups. It is designed to run headlessly in CI pipelines via JMeter's non-GUI mode.

**Tool version:** Apache JMeter 5.6.3  
**Run mode:** Non-GUI (`-n`)

---

## Test Plan Structure

```
TestPlan: Java Service Load Test
├── HTTP Request Defaults        ← sets host=localhost, port=8080
├── Thread Group 1: Health Check - 10 users × 5 loops
│   ├── GET /api/health          ← with HTTP 200 assertion
│   └── GET /api/ping
├── Thread Group 2: Users API - 25 concurrent × 10 loops
│   ├── GET /api/users
│   ├── GET /api/users/1
│   └── POST /api/users          ← with Content-Type: application/json header
├── Thread Group 3: Products API - 50 concurrent × 10 loops
│   ├── GET /api/products
│   ├── GET /api/products?category=Electronics
│   └── GET /api/products/1
├── Thread Group 4: Orders API - 30 concurrent × 10 loops
│   ├── GET /api/orders
│   ├── GET /api/orders/user/1
│   └── POST /api/orders         ← with Content-Type: application/json header
└── Result Collector             ← writes results/jmeter-results.jtl
```

---

## Thread Group Configuration

| Thread Group | Users | Loops | Ramp-up | Total Requests |
|---|---|---|---|---|
| Health Check | 10 | 5 | 5 s | 100 |
| Users API | 25 | 10 | 10 s | 750 |
| Products API | 50 | 10 | 15 s | 1,500 |
| Orders API | 30 | 10 | 10 s | 900 |
| **Total** | | | | **3,250** |

All four groups run **concurrently** (parallel execution).

---

## Running the Test

### Non-GUI (recommended)

```bash
cd jmeter

jmeter -n \
  -t load-test-plan.jmx \
  -l results/jmeter-results.jtl
```

### Generate HTML Dashboard

After the run, produce an interactive HTML report:

```bash
jmeter -g results/jmeter-results.jtl \
       -o results/html-report/
open results/html-report/index.html
```

### Open in GUI (plan editing only)

```bash
jmeter -t jmeter/load-test-plan.jmx
```

> Do not run load tests from the JMeter GUI — it consumes significantly more memory and skews results.

---

## Assertions

The Health Check thread group includes a **Response Assertion** that verifies each `/api/health` response returns HTTP `200`. Assertion failures are recorded in the JTL and appear as errors in the report.

---

## Understanding JTL Output

The `.jtl` file is a CSV with one row per sampler request:

| Column | Description |
|--------|-------------|
| `timeStamp` | Unix epoch (ms) of the sample |
| `elapsed` | Response time in milliseconds |
| `label` | Sampler name (e.g. `GET /api/users`) |
| `responseCode` | HTTP status code |
| `success` | `true` / `false` |
| `bytes` | Response body size |
| `latency` | Time-to-first-byte in ms |
| `connect` | TCP connect time in ms |

---

## CI Integration Example

```yaml
# GitHub Actions excerpt
- name: Run JMeter load test
  run: |
    jmeter -n \
      -t jmeter/load-test-plan.jmx \
      -l jmeter/results/jmeter-results.jtl
  env:
    JAVA_HOME: ${{ env.JAVA_HOME_21_X64 }}

- name: Upload JMeter results
  uses: actions/upload-artifact@v4
  with:
    name: jmeter-results
    path: jmeter/results/
```
