import { describe, expect, it } from 'vitest';

describe('Test environment setup', () => {
  it('loads .env.test variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DATABASE_URL).toContain('poplist-db-test');
    expect(process.env.PORT).toBe('4005');
  });

  it('uses safe test secrets (not the prod ones)', () => {
    expect(process.env.JWT_ACCESS_SECRET).toContain('test-access-secret');
    expect(process.env.JWT_REFRESH_SECRET).toContain('test-refresh-secret');
  });
});
