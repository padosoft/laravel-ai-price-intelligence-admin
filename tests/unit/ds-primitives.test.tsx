import { render, screen } from '@testing-library/react';
import {
  Price,
  PriceDelta,
  ConfidenceBadge,
  StatusBadge,
  AiBadge,
  HostChip,
  Flag,
} from '@/components/ds';

describe('Price', () => {
  it('formats cents as mono currency', () => {
    render(<Price cents={18900} currency="EUR" />);
    expect(screen.getByText('189.00')).toBeInTheDocument();
    expect(screen.getByText('€')).toBeInTheDocument();
  });
});

describe('PriceDelta', () => {
  it('marks a cheaper competitor as a threat (cheaper class)', () => {
    const { container } = render(<PriceDelta pct={-4.2} />);
    expect(container.querySelector('.price-delta.cheaper')).not.toBeNull();
  });

  it('marks a pricier competitor as safe (pricier class)', () => {
    const { container } = render(<PriceDelta pct={3.1} />);
    expect(container.querySelector('.price-delta.pricier')).not.toBeNull();
  });

  it('treats near-zero deltas as parity', () => {
    const { container } = render(<PriceDelta pct={0.2} />);
    expect(container.querySelector('.price-delta.parity')).not.toBeNull();
  });
});

describe('ConfidenceBadge', () => {
  it.each([
    [90, 'high'],
    [70, 'mid'],
    [40, 'low'],
  ])('grades %i as %s', (value, tier) => {
    const { container } = render(<ConfidenceBadge value={value} />);
    expect(container.querySelector(`.conf.${tier}`)).not.toBeNull();
    expect(screen.getByText(String(value))).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it('renders the human label for a known status', () => {
    render(<StatusBadge status="success" />);
    expect(screen.getByText('Succeeded')).toBeInTheDocument();
  });

  it('falls back to the raw status when unknown', () => {
    render(<StatusBadge status="weird" />);
    expect(screen.getByText('weird')).toBeInTheDocument();
  });
});

describe('AiBadge', () => {
  it('exposes the AI-generated disclosure title', () => {
    render(<AiBadge model="claude-haiku" />);
    expect(screen.getByTitle('AI-generated · claude-haiku')).toBeInTheDocument();
  });
});

describe('HostChip / Flag', () => {
  it('shows the host with its initial', () => {
    render(<HostChip host="amazon.it" />);
    expect(screen.getByText('amazon.it')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows the country code with a descriptive title', () => {
    render(<Flag code="IT" />);
    expect(screen.getByTitle('Italy')).toBeInTheDocument();
  });
});
