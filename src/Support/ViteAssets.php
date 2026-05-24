<?php

declare(strict_types=1);

namespace Padosoft\PriceIntelligenceAdmin\Support;

/**
 * Resolves the built SPA's entry assets (js + css) from the published Vite manifest.
 * Vite 5+ writes the manifest to .vite/manifest.json; older Vite wrote it at the
 * outDir root — both are checked so the panel loads regardless of the build's Vite major.
 */
final class ViteAssets
{
    private const ENTRY = 'index.html';

    /**
     * @return array{js: string|null, css: array<int, string>}
     */
    public static function resolve(string $publicDir): array
    {
        $candidates = [
            $publicDir.'/.vite/manifest.json',
            $publicDir.'/manifest.json',
        ];

        foreach ($candidates as $path) {
            if (! is_file($path)) {
                continue;
            }

            /** @var array<string, array{file?: string, css?: array<int, string>}> $manifest */
            $manifest = json_decode((string) file_get_contents($path), true) ?: [];
            $chunk = $manifest[self::ENTRY] ?? null;

            // A manifest may exist but not contain our entry (e.g. a stale/foreign build);
            // fall through to the next candidate rather than giving up here.
            if ($chunk !== null) {
                return [
                    'js' => $chunk['file'] ?? null,
                    'css' => $chunk['css'] ?? [],
                ];
            }
        }

        return ['js' => null, 'css' => []];
    }
}
