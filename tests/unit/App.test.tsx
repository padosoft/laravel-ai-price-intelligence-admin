import { render, screen } from '@testing-library/react';
import App from '@/App';

describe('App scaffold', () => {
  it('renders the boot screen with the API base url', () => {
    render(<App />);
    expect(screen.getByTestId('app-boot')).toBeInTheDocument();
    expect(screen.getByText(/API base:/)).toHaveTextContent('/api/v1');
  });
});
