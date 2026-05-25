import { api, ApiError, unwrap } from '@/lib/api/client';
import type { TenantMe, DashboardStats } from '@/lib/api/types';

describe('api client (mock-backed in tests)', () => {
  it('resolves GET /tenants/me from the fixture layer', async () => {
    const res = await api.get<{ data: TenantMe }>('/tenants/me');
    const me = unwrap(res);
    expect(me.tenant.code).toBe('ACME');
    expect(me.features.repricer).toBe(true);
    expect(me.abilities).toContain('*');
  });

  it('resolves GET /stats', async () => {
    const res = await api.get<{ data: DashboardStats }>('/stats');
    expect(unwrap(res).targets_active).toBeGreaterThan(0);
  });

  it('returns an empty page for unseeded list endpoints', async () => {
    // /rules has no mock fixtures yet (Repricer screen lands in A6), so it resolves to an
    // empty page via the LIST_PATHS fallback.
    const res = await api.get<{ data: unknown[] }>('/rules');
    expect(res.data).toEqual([]);
  });
});

describe('ApiError', () => {
  it('exposes status and field errors from problem+json', () => {
    const err = new ApiError(422, { type: 'about:blank', title: 'Unprocessable', status: 422, errors: { from: ['invalid'] } }, 'Unprocessable');
    expect(err.status).toBe(422);
    expect(err.fieldErrors.from).toEqual(['invalid']);
  });

  it('defaults field errors to an empty object', () => {
    const err = new ApiError(500, null, 'boom');
    expect(err.fieldErrors).toEqual({});
  });
});
