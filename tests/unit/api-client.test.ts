import { api, ApiError, fetchBlob, unwrap } from '@/lib/api/client';
import { mockDownload } from '@/lib/api/mocks';
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
    // /audit/fetch-logs has no mock fixtures, so it resolves to an empty page via the
    // LIST_PATHS fallback.
    const res = await api.get<{ data: unknown[] }>('/audit/fetch-logs');
    expect(res.data).toEqual([]);
  });

  it('accepts a FormData body for multipart uploads (CSV import)', async () => {
    // FormData bypasses JSON.stringify / Content-Type in the client; the csv mock acknowledges it.
    const form = new FormData();
    form.append('file', new File(['external_id,name\nX,Y'], 'catalog.csv', { type: 'text/csv' }));
    const res = await api.post<{ data: { imported: number } }>('/catalog/products:csv', form);
    expect(res.data.imported).toBe(0);
  });

  it('synthesizes a CSV blob for the catalog :export endpoint (mock mode)', async () => {
    // fetchBlob wraps the synthesized CSV; verify the blob + resolved filename...
    const { blob, filename } = await fetchBlob('/catalog/products:export', undefined, 'fallback.csv');
    expect(filename).toBe('catalog.csv');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    // ...and the underlying CSV text via mockDownload (jsdom's Blob has no .text()).
    const { text } = mockDownload('/catalog/products:export');
    expect(text.split('\n')[0]).toBe('external_id,sku,gtin,mpn,brand,name,our_price_cents,currency');
    expect(text).toContain('Acme X1 Pro 128GB Smartphone');
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
