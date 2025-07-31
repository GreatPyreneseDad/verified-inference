import request from 'supertest';
import express from 'express';
import routes from '../routes';

describe('Health Check', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use('/api', routes);
  });

  it('should return health status', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('status', 'healthy');
    expect(response.body.data).toHaveProperty('timestamp');
  });
});