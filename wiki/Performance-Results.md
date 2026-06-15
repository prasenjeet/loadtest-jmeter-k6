# Performance Results

Results from running both load tools against the Java service on the same host (loopback, no network overhead).

**Service:** Spring Boot 3.2.5 / Java 21 / in-memory storage  
**Host:** Single-core cloud container (shared compute)  
**Date:** June 2026

---

## JMeter Results

**Tool:** Apache JMeter 5.6.3 (non-GUI)  
**Total requests:** 3,250  
**Duration:** ~15 seconds

### Summary

| Metric | Value |
|--------|-------|
| Total Requests | 3,250 |
| Throughput | 219 req/s |
| **Error Rate** | **0.00%** |
| Avg Response Time | 1.66 ms |
| p50 (median) | 1 ms |
| p90 | 3 ms |
| p95 | 5 ms |
| p99 | 11 ms |
| Max | 69 ms |

### Per-Endpoint Breakdown

| Endpoint | Requests | Avg (ms) | p95 (ms) | Errors |
|---|---|---|---|---|
| GET /api/health | 50 | 3.4 | 9 | 0 |
| GET /api/ping | 50 | 2.3 | 10 | 0 |
| GET /api/users | 250 | 2.0 | 4 | 0 |
| GET /api/users/1 | 250 | 1.8 | 6 | 0 |
| POST /api/users | 250 | 2.2 | 6 | 0 |
| GET /api/products | 500 | 1.4 | 3 | 0 |
| GET /api/products?category=Electronics | 500 | 1.2 | 4 | 0 |
| GET /api/products/1 | 500 | 1.2 | 3 | 0 |
| GET /api/orders | 300 | 1.9 | 5 | 0 |
| GET /api/orders/user/1 | 300 | 1.8 | 5 | 0 |
| POST /api/orders | 300 | 2.0 | 5 | 0 |

### Observations

- **Zero errors** across all 3,250 requests and all HTTP assertions.
- **Products endpoints** were fastest (p95 = 3–4 ms) due to read-only access with no write contention.
- **Health endpoint** showed slightly higher p95 (9 ms) on first requests due to JVM warmup; stabilised quickly.
- **POST endpoints** were comparable to GETs — the `ConcurrentHashMap` + `AtomicLong` write path adds negligible overhead.

---

## k6 Results

**Tool:** Grafana k6 v0.54.0  
**Duration:** 2 minutes  
**Peak VUs:** 100 (15-second spike)

### Summary (representative run)

| Metric | Value |
|--------|-------|
| Total Requests | ~61,000 |
| Throughput | ~508 req/s |
| **Custom Error Rate** | **0.00%** |
| Avg Response Time | 5.5 ms |
| p50 (median) | 0.94 ms |
| p90 | 14.4 ms |
| p95 | 26.2 ms |
| Max | 247 ms |

### Endpoint-Level p95

| Endpoint Group | p95 (ms) |
|---|---|
| Health Check | ~24–75 ms |
| Users API | ~25–69 ms |
| Products API | ~22–65 ms |
| Orders API | ~36–85 ms |

### Threshold Results

| Threshold | Limit | Result |
|---|---|---|
| `http_req_duration p(95)` | < 500 ms | **PASSED** |
| `http_req_duration p(90)` | < 300 ms | **PASSED** |
| `error_rate` | < 1% | **PASSED** |
| `health_check_duration p(95)` | < 400 ms | **PASSED** |
| `user_api_duration p(95)` | < 500 ms | **PASSED** |
| `product_api_duration p(95)` | < 500 ms | **PASSED** |
| `order_api_duration p(95)` | < 500 ms | **PASSED** |

### VU Ramp Behaviour

```
VUs       Avg latency
  10      ~1 ms
  50      ~5–10 ms
 100      ~20–50 ms   ← spike; p95 rises but stays well under 500 ms
  50      ~10–20 ms   ← recovery
```

Latency scaled sub-linearly with VU count — a healthy sign that the service is not yet CPU- or lock-bound at these concurrency levels.

---

## Comparison: JMeter vs k6

| Aspect | JMeter | k6 |
|--------|--------|-----|
| Scripting | XML test plan | JavaScript |
| Execution model | Java threads | Go goroutines |
| Resource usage | Higher (JVM per thread) | Lower (lightweight VU) |
| Max VUs tested | 50 concurrent | 100 concurrent |
| Total requests | 3,250 | ~61,000 |
| Throughput | 219 req/s | 508 req/s |
| p95 | 5 ms | 26 ms |
| Error rate | 0.00% | 0.00% |
| HTML reports | Built-in dashboard | Requires Grafana/Cloud |
| CI friendliness | `-n` flag | Native, exit code 99 on threshold fail |
| Threshold enforcement | Manual post-processing | Built-in `thresholds` block |

> The difference in p95 (5 ms vs 26 ms) reflects different concurrency levels (50 vs 100 VUs), not a difference in tool accuracy.

---

## Key Takeaways

1. **The service handles in-process load with near-zero overhead** — sub-5 ms p95 at 50 concurrent users.
2. **No application errors** at any load level tested (0–100 concurrent VUs).
3. **JVM warmup** is visible in the first 2–3 seconds of JMeter results; plan warm-up time in real benchmarks.
4. **k6's staged ramp** caught latency growth more clearly than JMeter's fixed thread count — useful for capacity planning.
5. **In-memory storage** removes I/O as a variable; in a real service, database connection pool sizing and query optimisation would be the next tuning knobs.
