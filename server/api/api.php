<?php
// API endpoints for the action hub
header('Content-Type: application/json');

// Include database configuration
require_once __DIR__ . '/../config/database.php';

// Get the request path
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path = ltrim(str_replace('/api', '', $path), '/');

// Extract query parameters
$query = [];
parse_str(parse_url($request_uri, PHP_URL_QUERY) ?? '', $query);

// Route the request
switch ($path) {
    case 'posts':
        getPosts($query);
        break;
    case 'mark-complete':
        markComplete();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}

// Function to get posts
function getPosts($query) {
    global $db;
    
    try {
        // Build the SQL query
        $sql = "SELECT * FROM posts";
        $params = [];
        
        // Add filters if provided
        $conditions = [];
        
        // Filter by category
        if (!empty($query['category']) && $query['category'] !== 'All') {
            $conditions[] = "category = ?";
            $params[] = $query['category'];
        }
        
        // Filter by status
        if (!empty($query['status'])) {
            $conditions[] = "status = ?";
            $params[] = $query['status'];
        }
        
        // Add WHERE clause if we have conditions
        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }
        
        // Add sorting
        $sort = !empty($query['sort']) ? $query['sort'] : 'newest';
        switch ($sort) {
            case 'oldest':
                $sql .= " ORDER BY created_at ASC";
                break;
            case 'priority':
                $sql .= " ORDER BY CASE WHEN category = 'Urgent' THEN 1 ELSE 2 END, created_at DESC";
                break;
            case 'newest':
            default:
                $sql .= " ORDER BY created_at DESC";
                break;
        }
        
        // Execute query
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $posts = $stmt->fetchAll();
        
        // Return the results
        echo json_encode($posts);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    }
}

// Function to mark a post as complete
function markComplete() {
    global $db;
    
    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    $postId = isset($data['post_id']) ? $data['post_id'] : null;
    
    // Validate post ID
    if (!$postId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing post ID']);
        return;
    }
    
    try {
        // Update the post status in the database
        $stmt = $db->prepare("UPDATE posts SET status = 'completed', updated_at = NOW() WHERE id = ?");
        $result = $stmt->execute([$postId]);
        
        if ($result && $stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => "Post $postId marked as complete"]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => "Post $postId not found or already marked as complete"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    }
}
?>
