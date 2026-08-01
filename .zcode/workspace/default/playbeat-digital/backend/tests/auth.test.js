const { setup, teardown, clearDb, seedAdmin } = require('./helpers');

describe('Auth API', () => {
  let api;

  beforeAll(async () => {
    const ctx = await setup();
    api = ctx.request;
  });
  afterAll(teardown);
  beforeEach(clearDb);

  it('registers a new customer and returns a token', async () => {
    const res = await api().post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'jane@playbeat.digital',
      password: 'supersecret1',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('jane@playbeat.digital');
  });

  it('rejects duplicate registration', async () => {
    await api().post('/api/auth/register').send({
      name: 'Jane Doe', email: 'dup@playbeat.digital', password: 'supersecret1',
    });
    const res = await api().post('/api/auth/register').send({
      name: 'Jane Doe', email: 'dup@playbeat.digital', password: 'supersecret1',
    });
    expect(res.status).toBe(409);
  });

  it('logs in with valid credentials', async () => {
    await seedAdmin();
    const res = await api().post('/api/auth/login').send({
      email: 'test@playbeat.digital', password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects invalid credentials', async () => {
    const res = await api().post('/api/auth/login').send({
      email: 'nope@playbeat.digital', password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('protects the /me endpoint', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
