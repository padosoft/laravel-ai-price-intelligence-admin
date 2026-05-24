<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>price-intel · admin</title>
    <script>
        window.__PI_ADMIN__ = @json($runtime);
    </script>
    @php
        $manifestPath = public_path('vendor/price-intelligence-admin/.vite/manifest.json');
        $entry = 'index.html';
        $assets = ['css' => [], 'js' => null];
        if (is_file($manifestPath)) {
            $manifest = json_decode((string) file_get_contents($manifestPath), true) ?: [];
            $chunk = $manifest[$entry] ?? null;
            if ($chunk !== null) {
                $assets['js'] = $chunk['file'] ?? null;
                $assets['css'] = $chunk['css'] ?? [];
            }
        }
        $base = asset('vendor/price-intelligence-admin/');
    @endphp
    @foreach ($assets['css'] as $css)
        <link rel="stylesheet" href="{{ $base }}/{{ $css }}">
    @endforeach
</head>
<body>
    <div id="root"></div>
    @if ($assets['js'])
        <script type="module" src="{{ $base }}/{{ $assets['js'] }}"></script>
    @else
        <noscript>Run <code>npm run build</code> and publish assets to render the panel.</noscript>
    @endif
</body>
</html>
