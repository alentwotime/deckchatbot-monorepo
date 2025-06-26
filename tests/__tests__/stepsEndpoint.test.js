const request = require('supertest');

jest.mock('openai', () => ({
  chat: { completions: { create: jest.fn().mockResolvedValue({ choices: [{ message: { content: 'mocked' } }] }) } }
}), { virtual: true });
jest.mock('tesseract.js', () => ({ recognize: jest.fn() }), { virtual: true });
jest.mock('uuid', () => ({ v4: jest.fn(() => 'uuid') }), { virtual: true });
jest.mock('potrace', () => ({ trace: jest.fn() }), { virtual: true });

const { app } = require('../server.cjs');

describe('steps endpoint', () => {
  test('/calculate-steps basic', async () => {
    const res = await request(app)
      .post('/calculate-steps')
      .send({ height: "32" });
    expect(res.status).toBe(200);
    expect(res.body.steps).toBe(5);
  });

  test('/calculate-steps invalid', async () => {
    const res = await request(app)
      .post('/calculate-steps')
      .send({ height: 'foo' });
    expect(res.status).toBe(400);
  });
});
