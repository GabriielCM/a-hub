import request from 'supertest';
import { INestApplication } from '@nestjs/common';

// HTTP helper functions
export const api = {
  get: (app: INestApplication, path: string, token?: string) => {
    const req = request(app.getHttpServer()).get(`/api${path}`);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  },

  post: (app: INestApplication, path: string, body: any = {}, token?: string) => {
    const req = request(app.getHttpServer()).post(`/api${path}`).send(body);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  },

  patch: (app: INestApplication, path: string, body: any = {}, token?: string) => {
    const req = request(app.getHttpServer()).patch(`/api${path}`).send(body);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  },

  delete: (app: INestApplication, path: string, token?: string) => {
    const req = request(app.getHttpServer()).delete(`/api${path}`);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  },
};

// Response validation helpers
export function expectUnauthorized(response: request.Response): void {
  expect(response.status).toBe(401);
}

export function expectForbidden(response: request.Response): void {
  expect(response.status).toBe(403);
}

export function expectValidationError(response: request.Response): void {
  expect(response.status).toBe(400);
  expect(response.body.message).toBeDefined();
}

export function expectNotFound(response: request.Response): void {
  expect(response.status).toBe(404);
}

export function expectConflict(response: request.Response): void {
  expect(response.status).toBe(409);
}

export function expectSuccess(response: request.Response): void {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
}

export function expectCreated(response: request.Response): void {
  expect(response.status).toBe(201);
}
