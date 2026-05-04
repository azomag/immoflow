<?php

$defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

$frontendUrl = trim((string) env('FRONTEND_URL', ''));
if ($frontendUrl !== '') {
    $defaultOrigins[] = $frontendUrl;
}

$configuredOrigins = array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', implode(',', $defaultOrigins)))
);

$allowedOrigins = array_values(array_unique(array_filter([
    ...$defaultOrigins,
    ...$configuredOrigins,
])));

$defaultOriginPatterns = [
    '#^https://immoflow-[a-z0-9-]+\.vercel\.app$#',
];

$configuredOriginPatterns = array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGIN_PATTERNS', implode(',', $defaultOriginPatterns)))
);

$allowedOriginPatterns = array_values(array_unique(array_filter([
    ...$defaultOriginPatterns,
    ...$configuredOriginPatterns,
])));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $allowedOrigins,
    'allowed_origins_patterns' => $allowedOriginPatterns,
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
