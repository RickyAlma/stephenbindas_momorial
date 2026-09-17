<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$databaseDirectory = __DIR__ . '/data';
$databasePath = $databaseDirectory . '/tributes.sqlite';

try {
    if (!is_dir($databaseDirectory) && !mkdir($databaseDirectory, 0750, true) && !is_dir($databaseDirectory)) {
        throw new RuntimeException('Unable to create database directory.');
    }

    $database = new PDO('sqlite:' . $databasePath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $database->exec('PRAGMA busy_timeout = 5000');
    $database->exec(
        'CREATE TABLE IF NOT EXISTS tributes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            relationship TEXT NOT NULL DEFAULT \'\',
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        )'
    );

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $statement = $database->query(
            'SELECT id, full_name AS fullName, relationship, message, created_at AS createdAt
             FROM tributes ORDER BY id DESC'
        );
        respond(['tributes' => $statement->fetchAll()]);
    }

    if ($method !== 'POST') {
        http_response_code(405);
        header('Allow: GET, POST');
        respond(['error' => 'Method not allowed.']);
    }

    $payload = json_decode(file_get_contents('php://input'), true);
    if (!is_array($payload)) {
        http_response_code(400);
        respond(['error' => 'Invalid request.']);
    }

    $fullName = trim((string)($payload['fullName'] ?? ''));
    $relationship = trim((string)($payload['relationship'] ?? ''));
    $message = trim((string)($payload['message'] ?? ''));

    if ($fullName === '' || strlen($fullName) > 120 || $message === '' || strlen($message) > 5000 || strlen($relationship) > 120) {
        http_response_code(422);
        respond(['error' => 'Please provide a valid name and tribute.']);
    }

    $createdAt = gmdate('c');
    $statement = $database->prepare(
        'INSERT INTO tributes (full_name, relationship, message, created_at)
         VALUES (:fullName, :relationship, :message, :createdAt)'
    );
    $statement->execute([
        ':fullName' => $fullName,
        ':relationship' => $relationship,
        ':message' => $message,
        ':createdAt' => $createdAt,
    ]);

    http_response_code(201);
    respond([
        'tribute' => [
            'id' => (int)$database->lastInsertId(),
            'fullName' => $fullName,
            'relationship' => $relationship,
            'message' => $message,
            'createdAt' => $createdAt,
        ],
    ]);
} catch (Throwable $error) {
    http_response_code(500);
    respond(['error' => 'Tributes are temporarily unavailable.']);
}

function respond(array $payload): void
{
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
