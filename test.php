<?php
// Show all errors
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Starting database test...<br>";

// Database configuration - UPDATE THESE VALUES
$config = [
    'host' => 'localhost',     // Your database host
    'dbname' => 'bencoyac_click2',// Database name
    'username' => 'bencoyac_clicker', // Database username
    'password' => 'Klik-db-Us5!'  // Database password
];

echo "Config loaded...<br>";

try {
    echo "Attempting database connection...<br>";
    
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8mb4",
        $config['username'],
        $config['password']
    );
    
    echo "Connected to database successfully!<br>";
    
    // Test if table exists
    $tables = $pdo->query("SHOW TABLES LIKE 'leaderboard'")->fetchAll();
    if (empty($tables)) {
        echo "Table 'leaderboard' does not exist!<br>";
    } else {
        echo "Table 'leaderboard' exists.<br>";
        
        // Count rows
        $count = $pdo->query("SELECT COUNT(*) FROM leaderboard")->fetchColumn();
        echo "Number of rows in leaderboard: " . $count . "<br>";
        
        // Show table structure
        echo "Table structure:<br>";
        foreach($pdo->query("DESCRIBE leaderboard") as $row) {
            print_r($row);
            echo "<br>";
        }
    }
    
    // After your existing table checks, add this:
    echo "<br>Testing data insertion...<br>";
    
    // Insert a test record
    $stmt = $pdo->prepare("
        INSERT INTO leaderboard (username, score) 
        VALUES (:username, :score)
        ON DUPLICATE KEY UPDATE score = GREATEST(score, :new_score)
    ");
    
    $stmt->execute([
        'username' => 'TestUser2',
        'score' => 1000,
        'new_score' => 1000
    ]);
    
    echo "Test record inserted.<br>";
    
    // Retrieve and show data
    echo "<br>Current leaderboard data:<br>";
    $rows = $pdo->query("SELECT * FROM leaderboard ORDER BY score DESC")->fetchAll();
    foreach($rows as $row) {
        echo "Username: {$row['username']}, Score: {$row['score']}, Updated: {$row['last_updated']}<br>";
    }
    
} catch(PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "<br>";
    echo "Error Code: " . $e->getCode() . "<br>";
}

echo "Test script completed.";
?> 