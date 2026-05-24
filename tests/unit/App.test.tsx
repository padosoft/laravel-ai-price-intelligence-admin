import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';

describe('App shell', () => {
  it('renders the sidebar brand and nav, defaulting to the dashboard', async () => {
    render(<App />);
    // Wait for auth to resolve (mock resolves /tenants/me synchronously in tests).
    await waitFor(() => expect(screen.getByText('price-intel')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Dashboard/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('page-dashboard')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('navigates when a nav item is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('button', { name: /Catalog/ }));
    await user.click(screen.getByRole('button', { name: /Catalog/ }));
    expect(await screen.findByTestId('page-catalog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Catalog' })).toBeInTheDocument();
  });

  it('toggles the theme on the document element', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('button', { name: 'Toggle theme' }));
    const initial = document.documentElement.dataset.theme;
    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    expect(document.documentElement.dataset.theme).not.toBe(initial);
  });

  it('opens the command palette with Ctrl/Cmd+K and jumps to a route', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByTestId('page-dashboard'));
    await user.keyboard('{Control>}k{/Control}');
    const palette = await screen.findByRole('dialog', { name: 'Command palette' });
    const input = within(palette).getByPlaceholderText(/Search products, competitors/);
    await user.type(input, 'forecast');
    await user.click(within(palette).getByRole('option', { name: /Forecasts/ }));
    expect(screen.getByRole('heading', { name: 'Forecasts' })).toBeInTheDocument();
  });

  it('opens the tenant switcher from the topbar', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => screen.getByRole('button', { name: /Switch tenant/ }));
    await user.click(screen.getByRole('button', { name: /Switch tenant/ }));
    expect(screen.getByRole('heading', { name: 'Switch tenant' })).toBeInTheDocument();
    expect(screen.getByText('Acme España')).toBeInTheDocument();
  });
});
