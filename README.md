# Java Web Service Load Testing — JMeter & k6

A complete load testing suite for a sample Spring Boot REST API using Apache JMeter and Grafana k6.

## Project Structure

```
.
├── java-service/                   # Spring Boot web service
│   ├── pom.xml
│   └── src/main/java/com/example/loadtest/
│       ├── LoadTestServiceApplication.java
│       ├── controller/
│       │   ├── HealthController.java   # GET /api/health, /api/ping
│       │   ├── UserController.java     # CRUD on /api/users
│       │   ├── ProductController.java  # GET /api/products
│       │   └── OrderController.java    # CRUD on /api/orders
│       ├── model/
│       │   ├── User.java
│       │   ├── Product.java
│       │   └── Order.java
│       └── service/
│           └── DataStore.java          # In-memory ConcurrentHashMap store
│
├── jmeter/
│   ├── load-test-plan.jmx              # JMeter test plan (4 thread groups)
│   └── results/
│       └── jmeter-results.jtl          # Raw results (CSV)
│
├── k6/
│   ├── load-test.js                    # k6 script with staged ramp + thresholds
│   └── results/
│       └── k6-summary.json             # k6 summary output
│
└── results/
    └── performance-report.md           # Consolidated performance report
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service health + uptime |
| GET | `/api/ping` | Ping/pong |
| GET | `/api/users` | List all users |
| GET | `/api/users/{id}` | Get user by ID |
| POST | `/api/users` | Create user |
| DELETE | `/api/users/{id}` | Delete user |
| GET | `/api/products` | List products (supports `?category=X`) |
| GET | `/api/products/{id}` | Get product by ID |
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/{id}` | Get order by ID |
| GET | `/api/orders/user/{userId}` | Get orders by user |
| POST | `/api/orders` | Create order |

## Prerequisites

- Java 21+, Maven 3.9+
- Apache JMeter 5.6+ (download from https://jmeter.apache.org/download_jmeter.cgi)
- k6 (https://k6.io/docs/getting-started/installation/)

## Quick Start

### 1. Build and start the service

```bash
cd java-service
mvn package -q -DskipTests
java -jar target/loadtest-service-1.0.0.jar &

# Verify it's up
curl http://localhost:8080/api/health
```

### 2. Run JMeter load test

```bash
cd jmeter
jmeter -n -t load-test-plan.jmx -l results/jmeter-results.jtl

# Generate HTML report
jmeter -g results/jmeter-results.jtl -o results/html-report/
```

### 3. Run k6 load test

```bash
cd k6
k6 run load-test.js

# Override base URL
k6 run -e BASE_URL=http://localhost:8080 load-test.js
```

## JMeter Test Plan

Four thread groups run concurrently:

| Group | Users | Loops | Ramp-up |
|---|---|---|---|
| Health Check | 10 | 5 | 5 s |
| Users API | 25 | 10 | 10 s |
| Products API | 50 | 10 | 15 s |
| Orders API | 30 | 10 | 10 s |

**Result:** 3,250 requests · 219 req/s · 0% errors · p95 = 5 ms

## k6 Load Test

Staged ramp simulating realistic traffic patterns:

```
10 VUs → 50 VUs → sustain 50 → spike 100 → scale to 50 → 0
```

**Thresholds enforced:**
- `p(95) < 500 ms` — all requests
- `p(90) < 300 ms` — all requests
- `error_rate < 1%` — custom counter (excludes expected 404s)
- Per-endpoint `p(95) < 400–500 ms`

**Result:** ~35,000 requests · 235–510 req/s · 0% error rate · ALL thresholds PASSED

## Key Performance Findings

- **p95 latency**: 5 ms (JMeter @ 50 concurrent) / 140–192 ms (k6 @ 100 VU spike)
- **Peak throughput**: 507 req/s observed
- **Error rate**: 0% application errors across both tools
- **JVM warmup**: Visible in first 2–3 seconds; JIT compilation drops p99 from ~70 ms to ~11 ms
