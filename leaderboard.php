<?php
// Remove or comment out these debug settings
// error_reporting(E_ALL);
// ini_set('display_errors', 1);
// ini_set('log_errors', 1);
// ini_set('error_log', 'debug.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

function logError($message, $data = null) {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] ERROR: $message";
    if ($data) {
        $logMessage .= " | " . (is_array($data) ? json_encode($data) : $data);
    }
    error_log($logMessage . "\n", 3, "error.log");
}

function logInfo($message, $data = null) {
    // Only log significant events
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] INFO: $message";
    if ($data) {
        $logMessage .= " | " . (is_array($data) ? json_encode($data) : $data);
    }
    error_log($logMessage . "\n", 3, "game.log");
}

try {
    $pdo = new PDO(
        "mysql:host=localhost;dbname=bencoyac_click2;charset=utf8mb4",
        "bencoyac_clicker",     // Your database username
        "Klik-db-Us5!",      // Your database password
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    // Remove these debug logs
    // error_log("Database connected successfully");

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        // Remove these debug logs
        // error_log("Received data: " . $input);
        
        $data = json_decode($input, true);
        // Remove these debug logs
        // error_log("Decoded data: " . print_r($data, true));
        
        if (!isset($data['username']) || !isset($data['score'])) {
            logError('Invalid request data', $data);
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request']);
            exit;
        }

        $username = $data['username'];
        $scoreInput = $data['score']; // Score comes in as a string or number from JS

        // Validate and prepare score as a string for VARCHAR(255)
        // Ensure it's numeric and non-negative
        if (!is_numeric($scoreInput) || $scoreInput < 0) {
            logError('Invalid score: not numeric or negative', ['username' => $username, 'score' => $scoreInput]);
            http_response_code(400);
            echo json_encode(['error' => 'Invalid score value']);
            exit;
        }

        // Convert to a plain integer string, handling potential float/scientific notation from JS.
        $scoreString = number_format($scoreInput, 0, '.', '');

        // Ensure the result is a string of digits (e.g., "1234567890123456789")
        if (!ctype_digit($scoreString)) {
            logError('Invalid score: failed to convert to digit string', ['username' => $username, 'original_score' => $scoreInput, 'formatted_score' => $scoreString]);
            http_response_code(400);
            echo json_encode(['error' => 'Invalid score format after processing']);
            exit;
        }

        // Get user's previous high score
        $stmt = $pdo->prepare('SELECT score FROM leaderboard WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $previousScore = $stmt->fetchColumn();

        // Only log if it's a new high score
        if (!$previousScore || bccomp($scoreString, (string)$previousScore) > 0) {
            logInfo('New high score', [
                'username' => $username,
                'newScore' => $scoreString,
                'previousScore' => $previousScore ?: '0'
            ]);
        }

        // Update or insert score
        $stmt = $pdo->prepare('
            INSERT INTO leaderboard (username, score, last_updated)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            score = IF(CAST(VALUES(score) AS DECIMAL(65,0)) > CAST(score AS DECIMAL(65,0)), VALUES(score), score),
            last_updated = NOW()
        ');
        // Note: Using IF instead of GREATEST with explicit casts for clarity with VARCHAR.
        // GREATEST(CAST(score AS DECIMAL(65,0)), CAST(VALUES(score) AS DECIMAL(65,0))) would also work.
        $stmt->execute([$username, $scoreString]);
    }

    // Get updated leaderboard data
    $stmt = $pdo->query("SELECT username, score, last_updated FROM leaderboard ORDER BY CAST(score AS DECIMAL(65,0)) DESC LIMIT 100");
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Remove these debug logs
    // error_log("Retrieved " . count($result) . " records");
    // error_log("Sending response: " . json_encode($result));
    
    echo json_encode($result);

} catch (PDOException $e) {
    logError('Database error', [
        'message' => $e->getMessage(),
        'code' => $e->getCode()
    ]);
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
} catch (Exception $e) {
    logError('Server error', [
        'message' => $e->getMessage(),
        'code' => $e->getCode()
    ]);
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
?>