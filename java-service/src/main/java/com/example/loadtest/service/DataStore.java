package com.example.loadtest.service;

import com.example.loadtest.model.Order;
import com.example.loadtest.model.Product;
import com.example.loadtest.model.User;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class DataStore {

    private final Map<Long, User> users = new ConcurrentHashMap<>();
    private final Map<Long, Product> products = new ConcurrentHashMap<>();
    private final Map<Long, Order> orders = new ConcurrentHashMap<>();

    private final AtomicLong userIdSeq = new AtomicLong(10);
    private final AtomicLong orderIdSeq = new AtomicLong(100);

    public DataStore() {
        users.put(1L, new User(1L, "Alice Johnson", "alice@example.com", "ADMIN"));
        users.put(2L, new User(2L, "Bob Smith", "bob@example.com", "USER"));
        users.put(3L, new User(3L, "Carol White", "carol@example.com", "USER"));
        users.put(4L, new User(4L, "Dave Brown", "dave@example.com", "MANAGER"));
        users.put(5L, new User(5L, "Eve Davis", "eve@example.com", "USER"));

        products.put(1L, new Product(1L, "Laptop Pro 15", "Electronics", 1299.99, 50));
        products.put(2L, new Product(2L, "Wireless Mouse", "Electronics", 29.99, 200));
        products.put(3L, new Product(3L, "USB-C Hub", "Electronics", 49.99, 150));
        products.put(4L, new Product(4L, "Mechanical Keyboard", "Electronics", 89.99, 75));
        products.put(5L, new Product(5L, "4K Monitor", "Electronics", 399.99, 30));
        products.put(6L, new Product(6L, "Java Programming Book", "Books", 39.99, 100));
        products.put(7L, new Product(7L, "Ergonomic Chair", "Furniture", 299.99, 20));
        products.put(8L, new Product(8L, "Standing Desk", "Furniture", 499.99, 15));

        orders.put(1L, new Order(1L, 1L, 1L, 1, 1299.99, "DELIVERED"));
        orders.put(2L, new Order(2L, 2L, 2L, 2, 59.98, "SHIPPED"));
        orders.put(3L, new Order(3L, 3L, 5L, 1, 399.99, "PROCESSING"));
    }

    public List<User> getAllUsers() { return new ArrayList<>(users.values()); }
    public User getUserById(Long id) { return users.get(id); }
    public User createUser(User user) {
        user.setId(userIdSeq.incrementAndGet());
        users.put(user.getId(), user);
        return user;
    }
    public boolean deleteUser(Long id) { return users.remove(id) != null; }

    public List<Product> getAllProducts() { return new ArrayList<>(products.values()); }
    public Product getProductById(Long id) { return products.get(id); }
    public List<Product> getProductsByCategory(String category) {
        return products.values().stream()
                .filter(p -> p.getCategory().equalsIgnoreCase(category))
                .toList();
    }

    public List<Order> getAllOrders() { return new ArrayList<>(orders.values()); }
    public Order getOrderById(Long id) { return orders.get(id); }
    public Order createOrder(Order order) {
        order.setId(orderIdSeq.incrementAndGet());
        orders.put(order.getId(), order);
        return order;
    }
    public List<Order> getOrdersByUser(Long userId) {
        return orders.values().stream()
                .filter(o -> o.getUserId().equals(userId))
                .toList();
    }
}
