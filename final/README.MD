# E-Commerce REST API — Node.js + Express + MongoDB

Build fully-featured online stores: browse and manage products, handle customer accounts, collect reviews, and process orders — all through a secure, rate-limited JSON API.

---

## API Reference

All routes are prefixed with `/api/v1`.

### Auth — `/api/v1/auth`

| Method | Endpoint    | Description                              | Auth     |
|--------|-------------|------------------------------------------|----------|
| POST   | /register   | Register a new user (first user = admin) | No       |
| POST   | /login      | Login, sets signed httpOnly cookie       | No       |
| GET    | /logout     | Clear auth cookie                        | No       |

### Users — `/api/v1/users`

| Method | Endpoint             | Description                        | Auth      |
|--------|----------------------|------------------------------------|-----------|
| GET    | /                    | Get all users (non-admin only)     | Admin     |
| GET    | /showMe              | Get current logged-in user         | Any user  |
| PATCH  | /updateUser          | Update name and email              | Any user  |
| PATCH  | /updateUserPassword  | Update password                    | Any user  |
| GET    | /:id                 | Get single user by ID              | Any user  |

### Products — `/api/v1/products`

| Method | Endpoint          | Description                          | Auth     |
|--------|-------------------|--------------------------------------|----------|
| GET    | /                 | Get all products                     | No       |
| POST   | /                 | Create a product                     | Admin    |
| POST   | /uploadImage      | Upload product image (max 1 MB)      | Admin    |
| GET    | /:id              | Get single product (with reviews)    | No       |
| PATCH  | /:id              | Update a product                     | Admin    |
| DELETE | /:id              | Delete a product (cascades reviews)  | Admin    |
| GET    | /:id/reviews      | Get all reviews for a product        | No       |

### Reviews — `/api/v1/reviews`

| Method | Endpoint | Description                              | Auth     |
|--------|----------|------------------------------------------|----------|
| POST   | /        | Create a review (one per user/product)   | Any user |
| GET    | /        | Get all reviews                          | No       |
| GET    | /:id     | Get single review                        | No       |
| PATCH  | /:id     | Update a review                          | Any user |
| DELETE | /:id     | Delete a review                          | Any user |

### Orders — `/api/v1/orders`

| Method | Endpoint           | Description                     | Auth     |
|--------|--------------------|---------------------------------|----------|
| POST   | /                  | Create an order                 | Any user |
| GET    | /                  | Get all orders                  | Admin    |
| GET    | /showAllMyOrders   | Get current user's orders       | Any user |
| GET    | /:id               | Get single order                | Any user |
| PATCH  | /:id               | Update order to paid            | Any user |

---

## Data Models

### User
| Field    | Type   | Constraints                      |
|----------|--------|----------------------------------|
| name     | String | required, min 3, max 50          |
| email    | String | required, unique, valid email    |
| password | String | required, min 6 (bcrypt hashed)  |
| role     | String | `"admin"` \| `"user"` (default)  |

### Product
| Field         | Type     | Constraints                               |
|---------------|----------|-------------------------------------------|
| name          | String   | required, max 100                         |
| price         | Number   | required, default 0                       |
| description   | String   | required, max 1000                        |
| image         | String   | default `/uploads/example.jpeg`           |
| category      | String   | required, enum: `office/kitchen/bedroom`  |
| company       | String   | required, enum: `ikea/liddy/marcos`       |
| colors        | [String] | required, default `["#222"]`              |
| featured      | Boolean  | default false                             |
| freeShipping  | Boolean  | default false                             |
| inventory     | Number   | required, default 15                      |
| averageRating | Number   | auto-calculated from reviews              |
| numOfReviews  | Number   | auto-calculated from reviews              |
| user          | ObjectId | ref User (creator)                        |

### Review
| Field   | Type     | Constraints                          |
|---------|----------|--------------------------------------|
| rating  | Number   | required, 1–5                        |
| title   | String   | required, max 100                    |
| comment | String   | required                             |
| user    | ObjectId | ref User                             |
| product | ObjectId | ref Product                          |

Unique compound index on `{ product, user }` — one review per user per product. After every save/remove the product's `averageRating` and `numOfReviews` are recalculated automatically via aggregation pipeline.

### Order
| Field           | Type              | Constraints                                    |
|-----------------|-------------------|------------------------------------------------|
| tax             | Number            | required                                       |
| shippingFee     | Number            | required                                       |
| subtotal        | Number            | required                                       |
| total           | Number            | required                                       |
| orderItems      | [SingleOrderItem] | name, image, price, amount, product ref        |
| status          | String            | `pending/failed/paid/delivered/canceled`       |
| user            | ObjectId          | ref User                                       |
| clientSecret    | String            | from payment intent (stub in dev)              |
| paymentIntentId | String            | set when order is marked paid                  |

---

## Auth Flow

JWT-based with **role-based access control** (admin vs user).

1. Register or login → server signs a JWT and sets it as a signed `httpOnly` cookie (`token`).
2. Every protected route reads the cookie, verifies the JWT, and attaches `req.user = { name, userId, role }`.
3. `authorizePermissions('admin')` middleware gates admin-only routes.
4. The **first registered user** is automatically assigned the `admin` role.

> **Payment:** The order controller uses a `fakeStripeAPI` stub — **no real Stripe or payment gateway is integrated**. The `clientSecret` is a placeholder. Wire in the real Stripe Node SDK when going to production.

---

## Tech Stack

| Layer         | Technology                                         |
|---------------|----------------------------------------------------|
| Runtime       | Node.js 14.x                                       |
| Framework     | Express 4                                          |
| Database      | MongoDB via Mongoose 6                             |
| Auth          | JWT (`jsonwebtoken`) + signed `httpOnly` cookies   |
| Password      | bcryptjs (salt 10)                                 |
| Validation    | Mongoose built-in + Joi (registration, products)  |
| Security      | helmet, xss-clean, express-mongo-sanitize, cors    |
| Rate limiting | express-rate-limit (60 req / 15 min)               |
| File upload   | express-fileupload (images, 1 MB limit)            |

---

## Local Setup

```bash
# 1. Install dependencies
cd final
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set MONGO_URL and JWT_SECRET at minimum

# 3. Start dev server
npm run dev
```

### Environment Variables

| Variable     | Required | Description                       | Example                               |
|--------------|----------|-----------------------------------|---------------------------------------|
| PORT         | No       | HTTP port (default 5000)          | `5000`                                |
| MONGO_URL    | Yes      | MongoDB connection string         | `mongodb://localhost:27017/ecommerce` |
| JWT_SECRET   | Yes      | Secret used to sign JWTs          | `supersecretkey`                      |
| JWT_LIFETIME | Yes      | Token expiry                      | `30d`                                 |
| NODE_ENV     | No       | `development` or `production`     | `development`                         |

---

## Example Requests

### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'
```

### Login (saves cookie to file)
```bash
curl -c cookies.txt -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

### Get All Products
```bash
curl http://localhost:5000/api/v1/products
```

### Create Product (admin)
```bash
curl -b cookies.txt -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Accent Chair",
    "price": 25999,
    "description": "Cloud-like comfort, modern design.",
    "category": "office",
    "company": "marcos",
    "colors": ["#000", "#fff"]
  }'
```

### Create Order
```bash
curl -b cookies.txt -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product": "<product_id>", "amount": 2}],
    "tax": 399,
    "shippingFee": 499
  }'
```

### Create Review
```bash
curl -b cookies.txt -X POST http://localhost:5000/api/v1/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "product": "<product_id>",
    "rating": 5,
    "title": "Fantastic chair",
    "comment": "Extremely comfortable, arrived on time."
  }'
```

---

## Error Format

All errors return a consistent JSON body:

```json
{
  "success": false,
  "message": "Human-readable description",
  "error": {}
}
```

---

## License

MIT — see [LICENSE](LICENSE).
