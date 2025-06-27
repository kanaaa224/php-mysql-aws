<?php
define('DB_HOST', 'database');
define('DB_NAME', 'database-1');
define('DB_USER', 'user');
define('DB_PASS', 'password');
define('DB_MAX_SIZE', 1024 * 1024 * 5);

////////////////////////////////////////////////////////////////////////////////////////////////////

class Database {
    private static ?PDO $pdo = null;

    private static function connect(): PDO {
        if(self::$pdo === null) {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";

            self::$pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);

            self::$pdo->exec("
                CREATE TABLE IF NOT EXISTS json_data (
                    data_name VARCHAR(255) PRIMARY KEY,
                    json_text LONGTEXT NOT NULL
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            ");
        }

        return self::$pdo;
    }

    static function size(): int {
        $pdo = self::connect();

        $stmt = $pdo->query("SELECT SUM(LENGTH(json_text)) AS total FROM json_data");

        $result = $stmt->fetch();

        return $result['total'] ?? 0;
    }

    static function save(string $data_name, $json_data): bool {
        $pdo = self::connect();

        $json_text = json_encode($json_data, JSON_UNESCAPED_UNICODE);

        if($json_text === false) return false;

        $size = self::size();

        if($size + strlen($json_text) > DB_MAX_SIZE) return false;

        $stmt = $pdo->prepare("
            INSERT INTO json_data (data_name, json_text) VALUES (:name, :json)
            ON DUPLICATE KEY UPDATE json_text = :json
        ");

        return $stmt->execute([':name' => $data_name, ':json' => $json_text]);
    }

    static function load(string $data_name): mixed {
        $pdo = self::connect();

        $stmt = $pdo->prepare("SELECT json_text FROM json_data WHERE data_name = :name");

        $stmt->execute([':name' => $data_name]);

        $row = $stmt->fetch();

        if(!$row) return null;

        return json_decode($row['json_text'], true);
    }

    static function init(): void {
        $pdo = self::connect();

        $pdo->exec("TRUNCATE TABLE json_data");
    }

    static function names(): array {
        $pdo = self::connect();

        $stmt = $pdo->query("SELECT data_name FROM json_data");

        return $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    }
}
?>