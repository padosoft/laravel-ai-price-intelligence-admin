import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach } from 'vitest';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/queryClient';
import { resetMockState } from '@/lib/api/mocks';
import { ToastProvider } from '@/components/ds';
import { Dashboard } from '@/routes/Dashboard';
import { Catalog } from '@/routes/Catalog';
import { Targets } from '@/routes/Targets';

// Targets/Catalog mocks are now stateful (create pushes into in-memory collections); reset
// before each test so a created row in one case can't leak into another.
beforeEach(() => resetMockState());
// Always restore stubbed globals (e.g. window.print) even if a test throws mid-assertion.
afterEach(() => vi.unstubAllGlobals());

function wrap(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

describe('Dashboard', () => {
  it('renders KPI tiles from /stats', async () => {
    wrap(<Dashboard onNavigate={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Active targets')).toBeInTheDocument());
    // 4120 active targets from the stats fixture, formatted with a thousands separator.
    await waitFor(() => expect(screen.getByText('4,120')).toBeInTheDocument());
  });

  it('wires Refresh and Export digest (no dead buttons)', async () => {
    const user = userEvent.setup();
    const printSpy = vi.fn();
    vi.stubGlobal('print', printSpy);
    wrap(<Dashboard onNavigate={() => {}} />);
    await waitFor(() => expect(screen.getByText('Active targets')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Refresh/ }));
    await waitFor(() => expect(screen.getByText('Refreshing')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Export digest/ }));
    await waitFor(() => expect(screen.getByText('Preparing digest')).toBeInTheDocument());
    expect(printSpy).toHaveBeenCalled();
  });
});

describe('Catalog', () => {
  it('lists products and filters by brand', async () => {
    const user = userEvent.setup();
    wrap(<Catalog onNavigate={() => {}} />);
    await waitFor(() => expect(screen.getByText('Acme X1 Pro 128GB Smartphone')).toBeInTheDocument());
    // Filter to Nova → Acme product disappears.
    await user.click(screen.getByRole('button', { name: /^Nova/ }));
    expect(screen.queryByText('Acme X1 Pro 128GB Smartphone')).not.toBeInTheDocument();
    expect(screen.getByText('Nova OLED 55" 4K TV')).toBeInTheDocument();
  });

  it('creates a SKU via the modal (POST /catalog/products:bulk)', async () => {
    const user = userEvent.setup();
    wrap(<Catalog onNavigate={() => {}} />);
    await waitFor(() => expect(screen.getByText('Acme X1 Pro 128GB Smartphone')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /New SKU/ }));
    const dialog = screen.getByRole('dialog');
    const create = within(dialog).getByRole('button', { name: /Create SKU/ });
    expect(create).toBeDisabled();
    await user.type(within(dialog).getByLabelText('External ID'), 'NEW-SKU-1');
    await user.type(within(dialog).getByLabelText('Name'), 'Test Widget 9000');
    expect(create).toBeEnabled();
    await user.click(create);
    await waitFor(() => expect(screen.getByText('SKU created')).toBeInTheDocument());
    // The product appears in the table after the optimistic insert / refetch.
    await waitFor(() => expect(within(screen.getByRole('table')).getByText('Test Widget 9000')).toBeInTheDocument());
  });

  it('imports a CSV file (POST /catalog/products:csv)', async () => {
    const user = userEvent.setup();
    wrap(<Catalog onNavigate={() => {}} />);
    await waitFor(() => expect(screen.getByText('Acme X1 Pro 128GB Smartphone')).toBeInTheDocument());
    const file = new File(['external_id,name\nX,Y'], 'catalog.csv', { type: 'text/csv' });
    await user.upload(screen.getByTestId('csv-input') as HTMLInputElement, file);
    await waitFor(() => expect(screen.getByText('CSV import queued')).toBeInTheDocument());
  });

  it('exports the catalog as CSV (GET /catalog/products:export)', async () => {
    const user = userEvent.setup();
    wrap(<Catalog onNavigate={() => {}} />);
    await waitFor(() => expect(screen.getByText('Acme X1 Pro 128GB Smartphone')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Export CSV/ }));
    await waitFor(() => expect(screen.getByText('Export ready')).toBeInTheDocument());
  });
});

describe('Targets', () => {
  it('lists targets and queues a scrape', async () => {
    const user = userEvent.setup();
    wrap(<Targets />);
    await waitFor(() => expect(screen.getAllByText(/Product #/).length).toBeGreaterThan(0));
    const firstRow = screen.getAllByText(/Product #/)[0].closest('tr') as HTMLElement;
    await user.click(within(firstRow).getByRole('button', { name: 'Scrape now' }));
    // Toast confirms the queue (mock returns a queued count).
    await waitFor(() => expect(screen.getByText('Scrape queued')).toBeInTheDocument());
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    wrap(<Targets />);
    await waitFor(() => expect(screen.getAllByText(/Product #/).length).toBeGreaterThan(0));
    await user.click(screen.getByRole('button', { name: /^paused/ }));
    // Only the paused target (product #3) remains.
    await waitFor(() => expect(screen.getByText('Product #3')).toBeInTheDocument());
  });

  it('pauses an active target with toast feedback', async () => {
    const user = userEvent.setup();
    wrap(<Targets />);
    await waitFor(() => expect(screen.getAllByText(/Product #/).length).toBeGreaterThan(0));
    // First row (target 101) is active → its toggle is a Pause button.
    const firstRow = screen.getAllByText(/Product #/)[0].closest('tr') as HTMLElement;
    await user.click(within(firstRow).getByRole('button', { name: 'Pause' }));
    await waitFor(() => expect(screen.getByText('Target paused')).toBeInTheDocument());
  });

  it('creates a new target via the modal (POST /targets)', async () => {
    const user = userEvent.setup();
    wrap(<Targets />);
    await waitFor(() => expect(screen.getAllByText(/Product #/).length).toBeGreaterThan(0));
    // Count data rows via the table (toast bodies also contain "Product #", so don't count text).
    const rowCount = () => within(screen.getByRole('table')).getAllByRole('row').length;
    const before = rowCount();
    await user.click(screen.getByRole('button', { name: /New target/ }));
    // Modal opens; the Create button is disabled until a product is chosen.
    const dialog = screen.getByRole('dialog');
    const create = within(dialog).getByRole('button', { name: /Create target/ });
    expect(create).toBeDisabled();
    // Country defaults to "IT"; choosing a product enables submit. Select by the option's stable
    // value (the product id) rather than its label so the match is unambiguous.
    await user.selectOptions(within(dialog).getByLabelText('Product'), '1');
    expect(create).toBeEnabled();
    await user.click(create);
    await waitFor(() => expect(screen.getByText('Target created')).toBeInTheDocument());
    // Server-reflected list grows by one (optimistic row replaced by the refetch).
    await waitFor(() => expect(rowCount()).toBe(before + 1));
  });
});
