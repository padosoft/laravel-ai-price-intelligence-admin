import { render, screen } from '@testing-library/react';
import {
  PriceLineChart,
  ForecastChart,
  AnomalyScatter,
  Treemap,
  PriceDistribution,
  Gauge,
  StackedBar,
  MiniSpark,
  ColumnChart,
  type PriceSeries,
  type ForecastPoint,
  type ScatterPoint,
} from '@/components/charts';

const d = (iso: string) => new Date(iso);

const series: PriceSeries[] = [
  {
    id: 'amazon',
    name: 'amazon.it',
    color: '#ff9900',
    data: [
      { t: d('2026-05-01'), price: 18900 },
      { t: d('2026-05-02'), price: 18750 },
      { t: d('2026-05-03'), price: 18500 },
    ],
  },
];

describe('chart kit renders without crashing', () => {
  it('PriceLineChart draws an accessible chart', () => {
    render(<PriceLineChart series={series} ourPrice={19900} />);
    expect(screen.getByRole('img', { name: 'Price history' })).toBeInTheDocument();
  });

  it('ForecastChart draws history + forecast', () => {
    const history = series[0].data;
    const forecast: ForecastPoint[] = [
      { t: d('2026-05-04'), price: 18400, low: 18000, high: 18800 },
      { t: d('2026-05-05'), price: 18300, low: 17800, high: 18900 },
    ];
    render(<ForecastChart history={history} forecast={forecast} ourPrice={19900} />);
    expect(screen.getByRole('img', { name: 'Price forecast' })).toBeInTheDocument();
  });

  it('AnomalyScatter highlights anomalies', () => {
    const data: ScatterPoint[] = [
      { t: d('2026-05-01'), price: 18900 },
      { t: d('2026-05-02'), price: 9000, anomaly: true, sev: 'high', label: 'civetta' },
      { t: d('2026-05-03'), price: 18800 },
    ];
    render(<AnomalyScatter data={data} />);
    expect(screen.getByRole('img', { name: 'Price anomalies' })).toBeInTheDocument();
  });

  it('Treemap renders a cell per item and reports selection', () => {
    render(
      <Treemap
        items={[
          { id: 'phones', label: 'Smartphones', value: 40, score: 80 },
          { id: 'tv', label: 'TV', value: 20, score: 30 },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: /Smartphones/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /TV/ })).toBeInTheDocument();
  });

  it('Gauge shows its value and label', () => {
    render(<Gauge value={72} label="sentiment" />);
    expect(screen.getByRole('img', { name: 'sentiment: 72' })).toBeInTheDocument();
  });

  it('PriceDistribution, StackedBar, MiniSpark, ColumnChart render', () => {
    const { container } = render(
      <div>
        <PriceDistribution ourPrice={19900} competitors={[{ name: 'a', price: 18900 }, { name: 'b', price: 20100 }]} />
        <StackedBar segments={[{ label: 'cheaper', value: 3, color: 'red' }, { label: 'pricier', value: 7, color: 'green' }]} />
        <MiniSpark data={[1, 3, 2, 5, 4]} />
        <ColumnChart data={[5, 8, 3, 9]} />
      </div>,
    );
    // PriceDistribution + MiniSpark + ColumnChart are SVGs; StackedBar is a div bar.
    expect(container.querySelectorAll('svg').length).toBe(3);
    expect(screen.getByTitle('cheaper: 3')).toBeInTheDocument();
  });
});
