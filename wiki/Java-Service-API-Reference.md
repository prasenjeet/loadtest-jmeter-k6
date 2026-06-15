# Java Service API Reference

The service is a **Spring Boot 3.2** application running on Java 21. It exposes a JSON REST API with three domain resources (Users, Products, Orders) plus health endpoints. All data is stored in-memory using `ConcurrentHashMap`.

Base URL: `http://localhost:8080`

---

## Health Endpoints

### `GET /api/health`

Returns service health and uptime.

**Response `200 OK`:**
```json
{
  "status": "UP",
  "service": "loadtest-service",
  "version": "1.0.0",
  "timestamp": "2026-06-15T00:00:00.000Z",
  "uptime_ms": 12345
}
```

---

### `GET /api/ping`

Simple liveness probe.

**Response `200 OK`:**
```json
{ "message": "pong" }
```

---

## Users

### `GET /api/users`

Returns all users.

**Response `200 OK`:**
```json
[
  { "id": 1, "name": "Alice Johnson", "email": "alice@example.com", "role": "ADMIN" },
  { "id": 2, "name": "Bob Smith",     "email": "bob@example.com",   "role": "USER"  }
]
```

---

### `GET /api/users/{id}`

Returns a single user by ID.

| Status | Condition |
|--------|-----------|
| `200 OK` | User found |
| `404 Not Found` | No user with that ID |

**Response `200 OK`:**
```json
{ "id": 1, "name": "Alice Johnson", "email": "alice@example.com", "role": "ADMIN" }
```

---

### `POST /api/users`

Creates a new user. The server assigns the `id`.

**Request body:**
```json
{ "name": "Carol White", "email": "carol@example.com", "role": "USER" }
```

**Response `201 Created`:**
```json
{ "id": 11, "name": "Carol White", "email": "carol@example.com", "role": "USER" }
```

---

### `DELETE /api/users/{id}`

Deletes a user by ID.

| Status | Condition |
|--------|-----------|
| `204 No Content` | Deleted successfully |
| `404 Not Found` | No user with that ID |

---

## Products

Seed data contains 8 products across categories `Electronics`, `Books`, and `Furniture`.

### `GET /api/products`

Returns all products. Optionally filter by category.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string (optional) | Case-insensitive category filter |

**Examples:**
```
GET /api/products
GET /api/products?category=Electronics
GET /api/products?category=Books
```

**Response `200 OK`:**
```json
[
  { "id": 1, "name": "Laptop Pro 15", "category": "Electronics", "price": 1299.99, "stock": 50 },
  { "id": 2, "name": "Wireless Mouse", "category": "Electronics", "price": 29.99, "stock": 200 }
]
```

---

### `GET /api/products/{id}`

Returns a single product by ID.

| Status | Condition |
|--------|-----------|
| `200 OK` | Product found |
| `404 Not Found` | No product with that ID |

---

## Orders

### `GET /api/orders`

Returns all orders.

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "productId": 1,
    "quantity": 1,
    "totalPrice": 1299.99,
    "status": "DELIVERED",
    "createdAt": "2026-06-15T00:00:00Z"
  }
]
```

---

### `GET /api/orders/{id}`

Returns a single order by ID.

| Status | Condition |
|--------|-----------|
| `200 OK` | Order found |
| `404 Not Found` | No order with that ID |

---

### `GET /api/orders/user/{userId}`

Returns all orders for a specific user.

**Response `200 OK`:** Array of order objects (may be empty).

---

### `POST /api/orders`

Creates a new order.

**Request body:**
```json
{
  "userId": 1,
  "productId": 2,
  "quantity": 2,
  "totalPrice": 59.98,
  "status": "PENDING"
}
```

**Response `201 Created`:**
```json
{
  "id": 101,
  "userId": 1,
  "productId": 2,
  "quantity": 2,
  "totalPrice": 59.98,
  "status": "PENDING",
  "createdAt": "2026-06-15T00:00:00Z"
}
```

---

## Seed Data

### Users (5)
| ID | Name | Role |
|----|------|------|
| 1 | Alice Johnson | ADMIN |
| 2 | Bob Smith | USER |
| 3 | Carol White | USER |
| 4 | Dave Brown | MANAGER |
| 5 | Eve Davis | USER |

### Products (8)
| ID | Name | Category | Price |
|----|------|----------|-------|
| 1 | Laptop Pro 15 | Electronics | $1,299.99 |
| 2 | Wireless Mouse | Electronics | $29.99 |
| 3 | USB-C Hub | Electronics | $49.99 |
| 4 | Mechanical Keyboard | Electronics | $89.99 |
| 5 | 4K Monitor | Electronics | $399.99 |
| 6 | Java Programming Book | Books | $39.99 |
| 7 | Ergonomic Chair | Furniture | $299.99 |
| 8 | Standing Desk | Furniture | $499.99 |
