package com.example.loadtest.controller;

import com.example.loadtest.model.Order;
import com.example.loadtest.service.DataStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final DataStore dataStore;

    public OrderController(DataStore dataStore) {
        this.dataStore = dataStore;
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return dataStore.getAllOrders();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        Order order = dataStore.getOrderById(id);
        return order != null ? ResponseEntity.ok(order) : ResponseEntity.notFound().build();
    }

    @GetMapping("/user/{userId}")
    public List<Order> getOrdersByUser(@PathVariable Long userId) {
        return dataStore.getOrdersByUser(userId);
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        Order created = dataStore.createOrder(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
