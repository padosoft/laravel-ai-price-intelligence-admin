<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-theme="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>price-intel · admin</title>
    <script>
        window.__PI_ADMIN__ = {!! \Illuminate\Support\Js::from($runtime) !!};
    </script>
    @foreach ($assets['css'] as $css)
        <link rel="stylesheet" href="{{ $assetBase }}{{ $css }}">
    @endforeach
</head>
<body>
    <div id="root"></div>
    @if ($assets['js'])
        <script type="module" src="{{ $assetBase }}{{ $assets['js'] }}"></script>
    @else
        {{-- Visible (not <noscript>): a missing entry means the assets weren't built/published,
             which must surface even with JavaScript enabled. --}}
        <p style="font-family: system-ui, sans-serif; padding: 2rem;">
            Admin panel assets not found. Run <code>npm run build</code> and publish them via
            <code>php artisan vendor:publish --tag=price-intelligence-admin-assets</code>.
        </p>
    @endif
</body>
</html>
