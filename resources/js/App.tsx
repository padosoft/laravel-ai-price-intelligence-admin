import { runtimeConfig } from './config';

// A0 baseline shell. The real design system, navigation, and screens land in the
// subsequent admin phases (A1+). This placeholder verifies the build/test toolchain.
export default function App() {
  return (
    <main className="app-boot" data-testid="app-boot">
      <h1>price-intel · admin</h1>
      <p>Scaffold ready. API base: {runtimeConfig.apiBaseUrl}</p>
    </main>
  );
}
