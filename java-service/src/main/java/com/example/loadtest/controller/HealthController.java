package com.example.loadtest.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final Instant startTime = Instant.now();

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "loadtest-service",
                "version", "1.0.0",
                "timestamp", Instant.now().toString(),
                "uptime_ms", System.currentTimeMillis() - startTime.toEpochMilli()
        );
    }

    @GetMapping("/ping")
    public Map<String, String> ping() {
        return Map.of("message", "pong");
    }
}
