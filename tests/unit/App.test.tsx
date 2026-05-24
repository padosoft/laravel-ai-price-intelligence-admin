import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';

describe('App shell', () => {
  it('renders the sidebar brand and nav, defaulting to the dashboard', () => {
    render(<App />);
    expect(screen.getByText('price-intel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.getByTestId('app-page')).toHaveTextContent('dashboard');
  });

  it('navigates when a nav item is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Catalog/ }));
    expect(screen.getByRole('heading', { name: 'Catalog' })).toBeInTheDocument();
    expect(screen.getByTestId('app-page')).toHaveTextContent('catalog');
  });

  it('toggles the theme on the document element', async () => {
    const user = userEvent.setup();
    render(<App />);
    const initial = document.documentElement.dataset.theme;
    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    expect(document.documentElement.dataset.theme).not.toBe(initial);
  });
});
