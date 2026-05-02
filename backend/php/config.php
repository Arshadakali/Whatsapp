<?php
declare(strict_types=1);

function load_env_file(string $filePath): void
{
    static $loaded = [];

    if (isset($loaded[$filePath])) {
        return;
    }

    $loaded[$filePath] = true;

    if (!is_file($filePath)) {
        return;
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        [$name, $value] = array_pad(explode('=', $line, 2), 2, '');
        $name = trim($name);
        $value = trim($value);

        if ($name === '') {
            continue;
        }

        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        if (getenv($name) !== false) {
            continue;
        }

        putenv(sprintf('%s=%s', $name, $value));
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
}

load_env_file(__DIR__ . DIRECTORY_SEPARATOR . '.env');

function env_value(string $key, ?string $default = null): ?string
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);

    if ($value === false || $value === null || $value === '') {
        return $default;
    }

    return (string) $value;
}

function db_config(): array
{
    return [
        'host' => env_value('DB_HOST'),
        'port' => env_value('DB_PORT', '3306'),
        'name' => env_value('DB_NAME'),
        'user' => env_value('DB_USER'),
        'password' => env_value('DB_PASSWORD', ''),
        'charset' => env_value('DB_CHARSET', 'utf8mb4'),
    ];
}

function db_is_configured(): bool
{
    $config = db_config();

    return $config['host'] !== null
        && $config['name'] !== null
        && $config['user'] !== null;
}

function get_pdo(bool $include_db = true): PDO
{
    static $pdo_with_db = null;
    static $pdo_no_db = null;

    if ($include_db && $pdo_with_db instanceof PDO) {
        return $pdo_with_db;
    }
    if (!$include_db && $pdo_no_db instanceof PDO) {
        return $pdo_no_db;
    }

    if (!db_is_configured()) {
        throw new RuntimeException('database_disconnected');
    }

    $config = db_config();
    
    if ($include_db) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $config['host'],
            $config['port'],
            $config['name'],
            $config['charset']
        );
    } else {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;charset=%s',
            $config['host'],
            $config['port'],
            $config['charset']
        );
    }

    try {
        $instance = new PDO(
            $dsn,
            (string) $config['user'],
            (string) $config['password'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        
        if ($include_db) {
            $pdo_with_db = $instance;
        } else {
            $pdo_no_db = $instance;
        }
        
        return $instance;
    } catch (PDOException $exception) {
        throw new RuntimeException('db_connect_failed', 0, $exception);
    }
}
