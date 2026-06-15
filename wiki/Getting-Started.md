# Getting Started

## Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Java JDK | 21 | [adoptium.net](https://adoptium.net) |
| Apache Maven | 3.9 | [maven.apache.org](https://maven.apache.org/download.cgi) |
| Apache JMeter | 5.6 | [jmeter.apache.org](https://jmeter.apache.org/download_jmeter.cgi) |
| Grafana k6 | 0.54 | [k6.io/docs](https://k6.io/docs/get-started/installation/) |

---

## 1. Clone the Repository

```bash
git clone https://github.com/prasenjeet/loadtest-jmeter-k6.git
cd loadtest-jmeter-k6
```

---

## 2. Build the Java Service

```bash
cd java-service
mvn package -q -DskipTests
```

The JAR is produced at `target/loadtest-service-1.0.0.jar`.

---

## 3. Start the Service

```bash
java -jar java-service/target/loadtest-service-1.0.0.jar
```

The service starts on **port 8080**. Verify it is up:

```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "status": "UP",
  "service": "loadtest-service",
  "version": "1.0.0",
  "timestamp": "2026-06-15T00:00:00Z",
  "uptime_ms": 1234
}
```

---

## 4. Run JMeter

```bash
cd jmeter

# Non-GUI load test (recommended for CI/headless)
jmeter -n -t load-test-plan.jmx -l results/jmeter-results.jtl

# Generate HTML dashboard from results
jmeter -g results/jmeter-results.jtl -o results/html-report/
```

See [JMeter Load Testing](JMeter-Load-Testing) for details on the test plan.

---

## 5. Run k6

```bash
cd k6
k6 run load-test.js
```

To override the target host:
```bash
k6 run -e BASE_URL=http://my-server:8080 load-test.js
```

See [k6 Load Testing](k6-Load-Testing) for details on the test script.

---

## Configuration

### Service Port

Pass `--server.port=<port>` to override:
```bash
java -jar java-service/target/loadtest-service-1.0.0.jar --server.port=9090
```

### JMeter Host/Port

The JMeter test plan targets `localhost:8080` via an **HTTP Request Defaults** config element. To point it at a remote host, open `jmeter/load-test-plan.jmx` in the JMeter GUI and update the defaults, or pass system properties:

```bash
jmeter -n -t load-test-plan.jmx \
       -Jhost=my-server \
       -Jport=8080 \
       -l results/jmeter-results.jtl
```

### k6 Base URL

```bash
k6 run -e BASE_URL=http://my-server:8080 k6/load-test.js
```
