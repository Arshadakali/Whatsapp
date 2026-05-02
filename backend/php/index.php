<?php
declare(strict_types=1);

// require_once __DIR__ . '/config.php';
if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond($data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function error_response(string $error, int $code = 400, array $extra = []): void
{
    respond(array_merge(['error' => $error], $extra), $code);
}

function route_path(): string
{
    $path = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';

    if ($scriptName !== '' && strpos($path, $scriptName) === 0) {
        $path = substr($path, strlen($scriptName));
    }

    return $path === '' ? '/' : $path;
}

function request_json(): array
{
    $body = file_get_contents('php://input');
    if (!$body) {
        return [];
    }

    $decoded = json_decode($body, true);
    return is_array($decoded) ? $decoded : [];
}

function make_id(string $prefix): string
{
    try {
        return $prefix . bin2hex(random_bytes(8));
    } catch (Throwable $throwable) {
        return $prefix . uniqid();
    }
}

function as_json_string($value): ?string
{
    if ($value === null) {
        return null;
    }

    if (is_string($value)) {
        return $value;
    }

    $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return $encoded === false ? null : $encoded;
}

function db_fetch_all($pdo, string $sql, array $params = []): array
{
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    return $statement->fetchAll();
}

function db_fetch_one($pdo, string $sql, array $params = []): ?array
{
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    $row = $statement->fetch();
    return $row === false ? null : $row;
}

function db_execute($pdo, string $sql, array $params = []): int
{
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    return $statement->rowCount();
}

function decode_google_credential(string $credential): array
{
    $parts = explode('.', $credential);
    if (count($parts) < 2) {
        throw new RuntimeException('invalid_google_credential');
    }

    $payload = strtr($parts[1], '-_', '+/');
    $padding = strlen($payload) % 4;
    if ($padding > 0) {
        $payload .= str_repeat('=', 4 - $padding);
    }

    $decoded = base64_decode($payload, true);
    if ($decoded === false) {
        throw new RuntimeException('invalid_google_credential');
    }

    $data = json_decode($decoded, true);
    if (!is_array($data)) {
        throw new RuntimeException('invalid_google_credential');
    }

    return $data;
}

function mock_user(string $email = 'user@example.com'): array
{
    $safeEmail = $email !== '' ? $email : 'user@example.com';
    $name = explode('@', $safeEmail)[0];

    return [
        'id' => 'u_mock_user',
        'name' => $name !== '' ? $name : 'Mock User',
        'email' => $safeEmail,
    ];
}

function mock_admin(string $email = 'admin@example.com'): array
{
    $safeEmail = $email !== '' ? $email : 'admin@example.com';

    return [
        'id' => 'mock_admin_1',
        'name' => 'Mock Admin',
        'email' => $safeEmail,
        'enabled' => 1,
        'created_at' => date('Y-m-d H:i:s'),
    ];
}

function handle_mock_api(string $method, string $path, array $json): void
{
    if ($method === 'GET') {
        if ($path === '/settings') {
            respond((object) [
                'adminLoginHidden' => 'false',
            ]);
        }

        if ($path === '/admins') {
            respond([mock_admin()]);
        }

        if ($path === '/users' && isset($_GET['id'])) {
            respond(mock_user('member@example.com'));
        }

        if (
            $path === '/posts' ||
            $path === '/faqs' ||
            $path === '/comments' ||
            $path === '/questions' ||
            $path === '/question-answers' ||
            $path === '/users'
        ) {
            respond([]);
        }
    }

    if ($method === 'POST') {
        if ($path === '/admins/login') {
            $email = isset($json['email']) && is_string($json['email']) ? $json['email'] : 'admin@example.com';
            respond(['admin' => mock_admin($email)]);
        }

        if ($path === '/users/login') {
            $email = isset($json['email']) && is_string($json['email']) ? $json['email'] : 'user@example.com';
            respond(['user' => mock_user($email)]);
        }

        if ($path === '/users/google-login') {
            respond(['user' => mock_user('google.user@example.com')]);
        }

        if ($path === '/users' || $path === '/admins') {
            respond([
                'ok' => true,
                'id' => uniqid('mock_', true),
            ], 201);
        }

        if ($path === '/posts' || $path === '/faqs' || $path === '/comments' || $path === '/questions') {
            respond([
                'id' => uniqid('mock_', true),
            ], 201);
        }

        if ($path === '/settings' || $path === '/question-answers') {
            respond(['ok' => true]);
        }
    }

    if ($method === 'PUT') {
        respond(['ok' => true]);
    }

    if ($method === 'DELETE') {
        respond(null, 204);
    }

    respond([
        'error' => 'not_found',
        'path' => $path,
    ], 404);
}

$method = $_SERVER['REQUEST_METHOD'];
$path = route_path();
$json = request_json();

/** @var PDO|null $pdo */
$pdo = null;

try {
    // We will use environment variables for DB connection in Vercel
    $db_host = getenv('DB_HOST') ?: null;
    $db_name = getenv('DB_NAME') ?: null;
    $db_user = getenv('DB_USER') ?: null;
    $db_pass = getenv('DB_PASSWORD') ?: '';

    // Check if get_pdo function exists (from config.php)
    if (function_exists('get_pdo')) {
        try {
            $pdo = get_pdo();
        } catch (Throwable $e) {
            $pdo = null;
        }
    }

    // Fallback to manual connection if get_pdo failed or doesn't exist
    if ($pdo === null && $db_host && $db_name && $db_user && class_exists('PDO')) {
        $dsn = "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4";
        $pdo = new PDO($dsn, $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
} catch (Throwable $exception) {
    // If DB connection fails, we will fall back to mock
    $pdo = null;
}

// If no PDO connection, use mock API and EXIT
if ($pdo === null) {
    handle_mock_api($method, $path, $json);
    exit;
}

/** @var PDO $pdo */
try {
    if ($method === 'GET') {
        if ($path === '/settings') {
            $rows = db_fetch_all($pdo, 'SELECT setting_key, setting_value FROM settings');
            $settings = [];
            foreach ($rows as $row) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
            respond((object) $settings);
        }

        if ($path === '/admins') {
            respond(
                db_fetch_all(
                    $pdo,
                    'SELECT id, name, email, role, enabled, created_at FROM admins ORDER BY created_at DESC'
                )
            );
        }

        if ($path === '/users' && isset($_GET['id'])) {
            $user = db_fetch_one(
                $pdo,
                'SELECT id, name, email, created_at FROM users WHERE id = :id LIMIT 1',
                ['id' => (string) $_GET['id']]
            );

            if ($user === null) {
                error_response('not_found', 404);
            }

            respond($user);
        }

        if ($path === '/users') {
            respond(
                db_fetch_all(
                    $pdo,
                    'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
                )
            );
        }

        if ($path === '/posts') {
            respond(db_fetch_all($pdo, 'SELECT * FROM posts ORDER BY date DESC, created_at DESC'));
        }

        if ($path === '/faqs') {
            respond(db_fetch_all($pdo, 'SELECT * FROM faqs ORDER BY created_at DESC'));
        }

        if ($path === '/comments') {
            if (isset($_GET['post_id'])) {
                respond(
                    db_fetch_all(
                        $pdo,
                        'SELECT * FROM comments WHERE post_id = :post_id ORDER BY created_at DESC',
                        ['post_id' => (string) $_GET['post_id']]
                    )
                );
            }

            respond(db_fetch_all($pdo, 'SELECT * FROM comments ORDER BY created_at DESC'));
        }

        if ($path === '/questions') {
            respond(db_fetch_all($pdo, 'SELECT * FROM questions ORDER BY created_at DESC'));
        }

        if ($path === '/question-answers') {
            if (isset($_GET['user_id'])) {
                respond(
                    db_fetch_all(
                        $pdo,
                        'SELECT * FROM question_answers WHERE user_id = :user_id ORDER BY updated_at DESC, created_at DESC',
                        ['user_id' => (string) $_GET['user_id']]
                    )
                );
            }

            respond(db_fetch_all($pdo, 'SELECT * FROM question_answers ORDER BY updated_at DESC, created_at DESC'));
        }
    }

    if ($method === 'POST') {
        if ($path === '/admins/login') {
            $admin = db_fetch_one(
                $pdo,
                'SELECT id, name, email, role, enabled, created_at
                 FROM admins
                 WHERE email = :email AND password_hash = :password_hash AND enabled = 1
                 LIMIT 1',
                [
                    'email' => (string) ($json['email'] ?? ''),
                    'password_hash' => (string) ($json['passwordHash'] ?? ''),
                ]
            );

            if ($admin === null) {
                error_response('invalid_credentials', 401);
            }

            respond(['admin' => $admin]);
        }

        if ($path === '/users/login') {
            $user = db_fetch_one(
                $pdo,
                'SELECT id, name, email, created_at
                 FROM users
                 WHERE email = :email AND password_hash = :password_hash
                 LIMIT 1',
                [
                    'email' => (string) ($json['email'] ?? ''),
                    'password_hash' => (string) ($json['passwordHash'] ?? ''),
                ]
            );

            if ($user === null) {
                error_response('invalid_credentials', 401);
            }

            respond(['user' => $user]);
        }

        if ($path === '/users/google-login') {
            $credential = (string) ($json['credential'] ?? '');
            if ($credential === '') {
                error_response('invalid_google_credential', 400);
            }

            $googleData = decode_google_credential($credential);
            $email = isset($googleData['email']) ? (string) $googleData['email'] : '';
            $name = isset($googleData['name']) ? (string) $googleData['name'] : 'Google User';
            $subject = isset($googleData['sub']) ? (string) $googleData['sub'] : null;

            if ($email === '') {
                error_response('invalid_google_credential', 400);
            }

            $existingUser = db_fetch_one(
                $pdo,
                'SELECT id, name, email, created_at FROM users WHERE email = :email LIMIT 1',
                ['email' => $email]
            );

            if ($existingUser !== null) {
                db_execute(
                    $pdo,
                    'UPDATE users
                     SET name = :name,
                         google_subject = :google_subject,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = :id',
                    [
                        'name' => $name,
                        'google_subject' => $subject,
                        'id' => $existingUser['id'],
                    ]
                );

                $user = db_fetch_one(
                    $pdo,
                    'SELECT id, name, email, created_at FROM users WHERE id = :id LIMIT 1',
                    ['id' => $existingUser['id']]
                );
                respond(['user' => $user]);
            }

            $userId = make_id('usr_');
            db_execute(
                $pdo,
                'INSERT INTO users (id, name, email, google_subject)
                 VALUES (:id, :name, :email, :google_subject)',
                [
                    'id' => $userId,
                    'name' => $name,
                    'email' => $email,
                    'google_subject' => $subject,
                ]
            );

            respond([
                'user' => db_fetch_one(
                    $pdo,
                    'SELECT id, name, email, created_at FROM users WHERE id = :id LIMIT 1',
                    ['id' => $userId]
                ),
            ], 201);
        }

        if ($path === '/users') {
            $id = isset($json['id']) && is_string($json['id']) && $json['id'] !== '' ? $json['id'] : make_id('usr_');
            $name = isset($json['name']) && is_string($json['name']) && $json['name'] !== '' ? $json['name'] : 'Member';
            $email = isset($json['email']) && is_string($json['email']) && $json['email'] !== '' ? $json['email'] : null;
            $passwordHash = isset($json['passwordHash']) && is_string($json['passwordHash']) && $json['passwordHash'] !== ''
                ? $json['passwordHash']
                : null;

            if ($email !== null) {
                $existingEmail = db_fetch_one(
                    $pdo,
                    'SELECT id FROM users WHERE email = :email LIMIT 1',
                    ['email' => $email]
                );

                if ($existingEmail !== null && $existingEmail['id'] !== $id) {
                    error_response('email_exists', 409);
                }
            }

            $existingUser = db_fetch_one(
                $pdo,
                'SELECT id FROM users WHERE id = :id LIMIT 1',
                ['id' => $id]
            );

            if ($existingUser !== null) {
                db_execute(
                    $pdo,
                    'UPDATE users
                     SET name = :name,
                         email = COALESCE(:email, email),
                         password_hash = COALESCE(:password_hash, password_hash),
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = :id',
                    [
                        'id' => $id,
                        'name' => $name,
                        'email' => $email,
                        'password_hash' => $passwordHash,
                    ]
                );

                respond([
                    'ok' => true,
                    'id' => $id,
                ]);
            }

            db_execute(
                $pdo,
                'INSERT INTO users (id, name, email, password_hash)
                 VALUES (:id, :name, :email, :password_hash)',
                [
                    'id' => $id,
                    'name' => $name,
                    'email' => $email,
                    'password_hash' => $passwordHash,
                ]
            );

            respond([
                'ok' => true,
                'id' => $id,
            ], 201);
        }

        if ($path === '/admins') {
            $email = isset($json['email']) && is_string($json['email']) ? trim($json['email']) : '';
            if ($email === '') {
                error_response('email_required', 422);
            }

            $existingAdmin = db_fetch_one(
                $pdo,
                'SELECT id FROM admins WHERE email = :email LIMIT 1',
                ['email' => $email]
            );

            if ($existingAdmin !== null) {
                error_response('email_exists', 409);
            }

            $adminId = make_id('adm_');
            db_execute(
                $pdo,
                'INSERT INTO admins (id, name, email, password_hash, role, enabled)
                 VALUES (:id, :name, :email, :password_hash, :role, :enabled)',
                [
                    'id' => $adminId,
                    'name' => (string) ($json['name'] ?? 'Admin'),
                    'email' => $email,
                    'password_hash' => (string) ($json['passwordHash'] ?? ''),
                    'role' => (string) ($json['role'] ?? 'admin'),
                    'enabled' => 1,
                ]
            );

            respond([
                'ok' => true,
                'id' => $adminId,
            ], 201);
        }

        if ($path === '/posts') {
            $postId = make_id('pst_');
            db_execute(
                $pdo,
                'INSERT INTO posts (id, title, description, category, date, organization, location, deadline, tags, link)
                 VALUES (:id, :title, :description, :category, :date, :organization, :location, :deadline, :tags, :link)',
                [
                    'id' => $postId,
                    'title' => (string) ($json['title'] ?? ''),
                    'description' => (string) ($json['description'] ?? ''),
                    'category' => (string) ($json['category'] ?? 'technology'),
                    'date' => (string) ($json['date'] ?? date('Y-m-d')),
                    'organization' => isset($json['organization']) ? (string) $json['organization'] : null,
                    'location' => isset($json['location']) ? (string) $json['location'] : null,
                    'deadline' => isset($json['deadline']) ? (string) $json['deadline'] : null,
                    'tags' => as_json_string($json['tags'] ?? []),
                    'link' => isset($json['link']) ? (string) $json['link'] : null,
                ]
            );

            respond(['id' => $postId], 201);
        }

        if ($path === '/faqs') {
            $faqId = make_id('faq_');
            db_execute(
                $pdo,
                'INSERT INTO faqs (id, question, status) VALUES (:id, :question, :status)',
                [
                    'id' => $faqId,
                    'question' => (string) ($json['question'] ?? ''),
                    'status' => 'pending',
                ]
            );

            respond(['id' => $faqId], 201);
        }

        if (preg_match('#^/faqs/([^/]+)/answer$#', $path, $matches) === 1) {
            db_execute(
                $pdo,
                'UPDATE faqs
                 SET answer = :answer,
                     status = :status,
                     answered_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id',
                [
                    'id' => $matches[1],
                    'answer' => (string) ($json['answer'] ?? ''),
                    'status' => 'answered',
                ]
            );

            respond(['ok' => true]);
        }

        if ($path === '/comments') {
            $commentId = make_id('cmt_');
            db_execute(
                $pdo,
                'INSERT INTO comments (id, post_id, type, content)
                 VALUES (:id, :post_id, :type, :content)',
                [
                    'id' => $commentId,
                    'post_id' => isset($json['post_id']) ? (string) $json['post_id'] : null,
                    'type' => (string) ($json['type'] ?? 'general'),
                    'content' => (string) ($json['content'] ?? ''),
                ]
            );

            respond(['id' => $commentId], 201);
        }

        if ($path === '/questions') {
            $questionId = make_id('qst_');
            db_execute(
                $pdo,
                'INSERT INTO questions (id, type, prompt, options, correct_option, answer_sample, points, keywords)
                 VALUES (:id, :type, :prompt, :options, :correct_option, :answer_sample, :points, :keywords)',
                [
                    'id' => $questionId,
                    'type' => (string) ($json['type'] ?? 'mcq'),
                    'prompt' => (string) ($json['prompt'] ?? $json['text'] ?? ''),
                    'options' => as_json_string($json['options'] ?? null),
                    'correct_option' => isset($json['correct_option']) ? (int) $json['correct_option'] : null,
                    'answer_sample' => isset($json['answer_sample']) ? (string) $json['answer_sample'] : null,
                    'points' => isset($json['points']) ? (int) $json['points'] : 1,
                    'keywords' => as_json_string($json['keywords'] ?? null),
                ]
            );

            respond(['id' => $questionId], 201);
        }

        if ($path === '/question-answers') {
            $questionId = (string) ($json['question_id'] ?? '');
            $userId = (string) ($json['user_id'] ?? '');

            if ($questionId === '' || $userId === '') {
                error_response('invalid_payload', 422);
            }

            $answerId = isset($json['id']) && is_string($json['id']) && $json['id'] !== ''
                ? $json['id']
                : make_id('ans_');

            $existingAnswer = db_fetch_one(
                $pdo,
                'SELECT id FROM question_answers WHERE question_id = :question_id AND user_id = :user_id LIMIT 1',
                [
                    'question_id' => $questionId,
                    'user_id' => $userId,
                ]
            );

            $user = db_fetch_one(
                $pdo,
                'SELECT name FROM users WHERE id = :id LIMIT 1',
                ['id' => $userId]
            );

            if ($existingAnswer !== null) {
                db_execute(
                    $pdo,
                    'UPDATE question_answers
                     SET response = :response,
                         score = :score,
                         max_score = :max_score,
                         submitted = :submitted,
                         user_name = :user_name,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = :id',
                    [
                        'id' => $existingAnswer['id'],
                        'response' => as_json_string($json['response'] ?? []),
                        'score' => isset($json['score']) ? (int) $json['score'] : null,
                        'max_score' => isset($json['max_score']) ? (int) $json['max_score'] : null,
                        'submitted' => !empty($json['submitted']) ? 1 : 0,
                        'user_name' => $user['name'] ?? null,
                    ]
                );

                respond(['ok' => true, 'id' => $existingAnswer['id']]);
            }

            db_execute(
                $pdo,
                'INSERT INTO question_answers (id, question_id, user_id, user_name, response, score, max_score, submitted)
                 VALUES (:id, :question_id, :user_id, :user_name, :response, :score, :max_score, :submitted)',
                [
                    'id' => $answerId,
                    'question_id' => $questionId,
                    'user_id' => $userId,
                    'user_name' => $user['name'] ?? null,
                    'response' => as_json_string($json['response'] ?? []),
                    'score' => isset($json['score']) ? (int) $json['score'] : null,
                    'max_score' => isset($json['max_score']) ? (int) $json['max_score'] : null,
                    'submitted' => !empty($json['submitted']) ? 1 : 0,
                ]
            );

            respond(['ok' => true, 'id' => $answerId], 201);
        }

        if ($path === '/settings') {
            $key = isset($json['key']) ? (string) $json['key'] : '';
            if ($key === '') {
                error_response('invalid_payload', 422);
            }

            db_execute(
                $pdo,
                'INSERT INTO settings (setting_key, setting_value)
                 VALUES (:setting_key, :setting_value)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP',
                [
                    'setting_key' => $key,
                    'setting_value' => isset($json['value']) ? (string) $json['value'] : '',
                ]
            );

            respond(['ok' => true]);
        }
    }

    if ($method === 'PUT') {
        if (preg_match('#^/posts/([^/]+)$#', $path, $matches) === 1) {
            db_execute(
                $pdo,
                'UPDATE posts
                 SET title = COALESCE(:title, title),
                     description = COALESCE(:description, description),
                     category = COALESCE(:category, category),
                     date = COALESCE(:date, date),
                     organization = :organization,
                     location = :location,
                     deadline = :deadline,
                     tags = :tags,
                     link = :link,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id',
                [
                    'id' => $matches[1],
                    'title' => isset($json['title']) ? (string) $json['title'] : null,
                    'description' => isset($json['description']) ? (string) $json['description'] : null,
                    'category' => isset($json['category']) ? (string) $json['category'] : null,
                    'date' => isset($json['date']) ? (string) $json['date'] : null,
                    'organization' => isset($json['organization']) ? (string) $json['organization'] : null,
                    'location' => isset($json['location']) ? (string) $json['location'] : null,
                    'deadline' => isset($json['deadline']) ? (string) $json['deadline'] : null,
                    'tags' => as_json_string($json['tags'] ?? []),
                    'link' => isset($json['link']) ? (string) $json['link'] : null,
                ]
            );

            respond(['ok' => true]);
        }

        if (preg_match('#^/admins/([^/]+)$#', $path, $matches) === 1) {
            db_execute(
                $pdo,
                'UPDATE admins
                 SET enabled = :enabled,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id',
                [
                    'id' => $matches[1],
                    'enabled' => !empty($json['enabled']) ? 1 : 0,
                ]
            );

            respond(['ok' => true]);
        }
    }

    if ($method === 'DELETE') {
        $deleteMap = [
            '#^/posts/([^/]+)$#' => 'posts',
            '#^/faqs/([^/]+)$#' => 'faqs',
            '#^/comments/([^/]+)$#' => 'comments',
            '#^/questions/([^/]+)$#' => 'questions',
            '#^/question-answers/([^/]+)$#' => 'question_answers',
            '#^/admins/([^/]+)$#' => 'admins',
            '#^/users/([^/]+)$#' => 'users',
        ];

        foreach ($deleteMap as $pattern => $tableName) {
            if (preg_match($pattern, $path, $matches) === 1) {
                db_execute(
                    $pdo,
                    sprintf('DELETE FROM %s WHERE id = :id', $tableName),
                    ['id' => $matches[1]]
                );
                respond(null, 204);
            }
        }
    }

    respond([
        'error' => 'not_found',
        'path' => $path,
    ], 404);
} catch (Throwable $e) {
    error_response($e->getMessage(), 500);
}
