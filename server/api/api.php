<?php
// API endpoints for the action hub
header('Content-Type: application/json');

// Get the request path
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path = ltrim(str_replace('/api', '', $path), '/');

// Route the request
switch ($path) {
    case 'posts':
        getPosts();
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
function getPosts() {
    // This would normally query your database
    $posts = [
        [
            'id' => 1,
            'title' => 'Example Post',
            'content' => 'This is a sample post',
            'sender' => 'example@example.com',
            'created_at' => date('Y-m-d H:i:s')
        ]
    ];
    
    echo json_encode($posts);
}

// Function to mark a post as complete
function markComplete() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $postId = isset($data['post_id']) ? $data['post_id'] : null;
    
    if (!$postId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing post ID']);
        return;
    }
    
    // In a real app, you would update the database here
    echo json_encode(['success' => true, 'message' => "Post $postId marked as complete"]);
}
