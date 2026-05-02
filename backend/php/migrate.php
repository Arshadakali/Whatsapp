<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function migration_output(string $message): void
{
    if (PHP_SAPI === 'cli') {
        fwrite(STDOUT, $message . PHP_EOL);
        return;
    }

    header('Content-Type: text/plain');
    echo $message . PHP_EOL;
}

try {
    // Try to connect without database first to ensure it exists
    $config = db_config();
    $dbName = $config['name'];

    try {
        $pdoNoDb = get_pdo(false);
        $pdoNoDb->exec(sprintf(
            "CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
            str_replace("`", "``", $dbName)
        ));
        migration_output("Database '{$dbName}' checked/created.");
    } catch (Throwable $e) {
        migration_output("Warning: Could not verify/create database '{$dbName}' (likely missing permissions). Continuing...");
    }

    $pdo = get_pdo();

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS schema_migrations (
            filename VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $applied = $pdo->query('SELECT filename FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN);
    $appliedMap = array_fill_keys($applied, true);

    $migrationFiles = glob(__DIR__ . '/migrations/*.sql');
    if ($migrationFiles === false) {
        throw new RuntimeException('Unable to read migration files.');
    }

    sort($migrationFiles, SORT_STRING);

    foreach ($migrationFiles as $filePath) {
        $fileName = basename($filePath);

        if (isset($appliedMap[$fileName])) {
            migration_output("Skipping {$fileName} (already applied)");
            continue;
        }

        $sql = file_get_contents($filePath);
        if ($sql === false) {
            throw new RuntimeException("Unable to read migration {$fileName}");
        }

        $pdo->beginTransaction();
        try {
            $pdo->exec($sql);
            $statement = $pdo->prepare('INSERT INTO schema_migrations (filename) VALUES (:filename)');
            $statement->execute(['filename' => $fileName]);
            $pdo->commit();
        } catch (Throwable $throwable) {
            $pdo->rollBack();
            throw $throwable;
        }

        migration_output("Applied {$fileName}");
    }

    migration_output('Migrations complete.');
    exit(0);
} catch (Throwable $throwable) {
    migration_output('Migration failed: ' . $throwable->getMessage());
    exit(1);
}
