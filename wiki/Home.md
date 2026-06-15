# loadtest-jmeter-k6 Wiki

Welcome to the project wiki. This repository contains a **sample Java web service** and a complete **performance/load testing suite** using two industry-standard tools: Apache JMeter and Grafana k6.

---

## Pages

| Page | Description |
|------|-------------|
| [Getting Started](Getting-Started) | Prerequisites, setup, and running the service |
| [Java Service API Reference](Java-Service-API-Reference) | All REST endpoints with request/response examples |
| [JMeter Load Testing](JMeter-Load-Testing) | JMeter test plan walkthrough and how to run it |
| [k6 Load Testing](k6-Load-Testing) | k6 script walkthrough, stages, and thresholds |
| [Performance Results](Performance-Results) | Actual benchmark output from both tools |

---

## Project Overview

```
loadtest-jmeter-k6/
├── java-service/          # Spring Boot 3.2 REST API (Java 21)
├── jmeter/                # JMeter test plan + results
├── k6/                    # k6 load test script + results
├── results/               # Consolidated performance report
└── wiki/                  # This wiki
```

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Web Service | Spring Boot | 3.2.5 |
| Language | Java | 21 |
| Build | Maven | 3.9+ |
| Load Tool 1 | Apache JMeter | 5.6.3 |
| Load Tool 2 | Grafana k6 | 0.54.0 |

## Quick Performance Summary

| Tool | Requests | Throughput | Error Rate | p95 Latency |
|------|----------|-----------|------------|-------------|
| JMeter | 3,250 | 219 req/s | **0.00%** | 5 ms |
| k6 | ~50,000+ | 507 req/s | **0.00%** | 26–192 ms |

> p95 grows at the 100-VU spike in k6 due to shared compute; no application errors occurred in either run.
