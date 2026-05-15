package com.example.loadtest.controller;

import com.example.loadtest.model.Product;
import com.example.loadtest.service.DataStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final DataStore dataStore;

    public ProductController(DataStore dataStore) {
        this.dataStore = dataStore;
    }

    @GetMapping
    public List<Product> getAllProducts(
            @RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            return dataStore.getProductsByCategory(category);
        }
        return dataStore.getAllProducts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = dataStore.getProductById(id);
        return product != null ? ResponseEntity.ok(product) : ResponseEntity.notFound().build();
    }
}
