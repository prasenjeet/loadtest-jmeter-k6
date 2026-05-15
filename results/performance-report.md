# Performance Test Report — Java Web Service

## Service Under Test

**Stack:** Spring Boot 3.2.5 + Java 21  
**Endpoints tested:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/ping` | Ping/pong |
| GET | `/api/users` | List all users |
| GET | `/api/users/{id}` | Get user by ID |
| POST | `/api/users` | Create user |
| GET | `/api/products` | List products (optionally filter by category) |
| GET | `/api/products/{id}` | Get product by ID |
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/{id}` | Get order by ID |
| GET | `/api/orders/user/{userId}` | Get orders by user |
| POST | `/api/orders` | Create order |

---

## JMeter Results

**Tool:** Apache JMeter 5.6.3  
**Mode:** Non-GUI (`-n`)  
**Test plan:** `jmeter/load-test-plan.jmx`

### Load Profile

| Thread Group | Concurrent Users | Loops | Ramp-up |
|---|---|---|---|
| Health Check | 10 | 5 | 5 s |
| Users API | 25 | 10 | 10 s |
| Products API | 50 | 10 | 15 s |
| Orders API | 30 | 10 | 10 s |

### Overall Results

| Metric | Value |
|--------|-------|
| **Total Requests** | 3,250 |
| **Throughput** | ~219 req/s |
| **Error Rate** | **0.00%** |
| **Avg Response Time** | 1.66 ms |
| **p50 (median)** | 1.00 ms |
| **p90** | 3 ms |
| **p95** | 5 ms |
| **p99** | 11 ms |
| **Max** | 69 ms |

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

> All assertions passed. 0 errors across 3,250 requests.

---

## k6 Results

**Tool:** k6 v0.54.0  
**Script:** `k6/load-test.js`

### Load Profile (staged ramp)

| Stage | Duration | Target VUs |
|---|---|---|
| Ramp up | 15 s | 10 |
| Ramp up | 30 s | 50 |
| Sustain | 30 s | 50 |
| Spike | 15 s | 100 |
| Scale down | 15 s | 50 |
| Ramp down | 15 s | 0 |

### Overall Results

| Metric | Value |
|--------|-------|
| **Total Requests** | ~35,000–61,000 (varies by run) |
| **Throughput** | ~235–510 req/s |
| **Custom Error Rate** | **0.00%** |
| **Avg Response Time** | 5–57 ms |
| **p50 (median)** | 1–33 ms |
| **p90** | 14–144 ms |
| **p95** | 26–192 ms |
| **Max** | 247–1,503 ms |

### Endpoint-Level p95

| Endpoint Group | p95 (ms) |
|---|---|
| Health Check | ~75–223 ms |
| Users API | ~69–200 ms |
| Products API | ~64–162 ms |
| Orders API | ~85–238 ms |

### Thresholds

| Threshold | Limit | Result |
|---|---|---|
| `http_req_duration p(95)` | < 500 ms | **PASSED** |
| `http_req_duration p(90)` | < 300 ms | **PASSED** |
| `error_rate` | < 1% | **PASSED** |
| `health_check_duration p(95)` | < 400 ms | **PASSED** |
| `user_api_duration p(95)` | < 500 ms | **PASSED** |
| `product_api_duration p(95)` | < 500 ms | **PASSED** |
| `order_api_duration p(95)` | < 500 ms | **PASSED** |

> All k6 thresholds passed. The `checks` rate reflects k6's default behavior of counting HTTP 404 responses as failures on the `http_req_failed` metric; the custom `error_rate` counter (which excludes intentional 404 tests) remained at 0.00%.

---

## Observations

1. **Excellent throughput**: The Spring Boot service handled 200–500+ req/s with in-memory storage and no I/O bottleneck.
2. **Low latency at moderate load**: p95 stayed under 30 ms during JMeter's 50-user phase.
3. **Graceful degradation under spike**: At 100 concurrent k6 VUs, p95 rose to 140–190 ms — well within acceptable limits.
4. **Zero application errors**: No 5xx responses were observed in either tool.
5. **JVM warmup effect**: First few seconds of JMeter showed higher latency (up to 69 ms) as the JVM JIT-compiled hot paths; subsequent requests dropped to sub-2 ms.
