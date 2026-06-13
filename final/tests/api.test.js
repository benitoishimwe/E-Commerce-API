const request = require('supertest');

// Base URL — override with TEST_URL env var to point at a running instance
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

describe('Auth', () => {
  const timestamp = Date.now();
  const testUser = {
    name: 'Test User',
    email: `testuser_${timestamp}@example.com`,
    password: 'secret123',
  };

  it('POST /api/v1/auth/register → 201, returns user + token cookie', async () => {
    const res = await request(BASE_URL)
      .post('/api/v1/auth/register')
      .send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('name', testUser.name);
  });

  it('POST /api/v1/auth/register with missing fields → 400', async () => {
    const res = await request(BASE_URL)
      .post('/api/v1/auth/register')
      .send({ email: 'bad@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login → 200, returns token cookie', async () => {
    const res = await request(BASE_URL)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
  });
});

describe('Products', () => {
  it('GET /api/v1/products → 200, returns array', async () => {
    const res = await request(BASE_URL).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it('POST /api/v1/products without auth → 401', async () => {
    const res = await request(BASE_URL)
      .post('/api/v1/products')
      .send({
        name: 'Test Chair',
        price: 100,
        description: 'A test product',
        category: 'office',
        company: 'ikea',
        colors: ['#222'],
      });
    expect(res.status).toBe(401);
  });
});

describe('Orders', () => {
  it('GET /api/v1/orders without auth → 401', async () => {
    const res = await request(BASE_URL).get('/api/v1/orders');
    expect(res.status).toBe(401);
  });
});
