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
        <noscript>Run <code>npm run build</code> and publish assets to render the panel.</noscript>
    @endif
</body>
</html>
