<?php
// API endpoints for the action hub
header('Content-Type: application/json');

// Enable CORS for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get the request path
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path = ltrim(str_replace('/api', '', $path), '/');

// Parse path segments for RESTful endpoints
$path_segments = explode('/', $path);
$base_resource = $path_segments[0] ?? '';
$resource_id = $path_segments[1] ?? null;

// Route the request
switch ($base_resource) {
    case 'posts':
        if ($resource_id) {
            getPostById($resource_id);
        } else {
            getPosts();
        }
        break;
    case 'mark-complete':
        markComplete();
        break;
    case 'comments':
        if ($_SERVER['REQUEST_METHOD'] === 'GET' && $resource_id) {
            getCommentsByPostId($resource_id);
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            addComment();
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
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
            'title' => 'Urgent: Website Down Issue',
            'content' => 'The client website at client.example.com is currently down. Initial investigation shows it might be a database connection issue. Need someone to look at this immediately.',
            'sender' => 'support@vpterdatahouse.com',
            'recipient' => 'info@vpterdatahouse.com',
            'category' => 'Urgent',
            'created_at' => date('Y-m-d H:i:s', strtotime('-1 day')),
            'action_type' => 'technical_support',
            'status' => 'new'
        ],
        [
            'id' => 2,
            'title' => 'Help spread the word: New product launch next week',
            'content' => 'We\'re launching our new data visualization tool next week and need help spreading the word on social media.',
            'sender' => 'marketing@vpterdatahouse.com',
            'recipient' => 'info@vpterdatahouse.com',
            'category' => 'Social Media',
            'created_at' => date('Y-m-d H:i:s', strtotime('-2 days')),
            'action_type' => 'social_share',
            'status' => 'new'
        ],
        [
            'id' => 3,
            'title' => 'Client Email Response Needed: Project Timeline',
            'content' => 'The client has asked for an updated timeline on the data migration project. Can someone from the project team draft a response?',
            'sender' => 'accounts@vpterdatahouse.com',
            'recipient' => 'info@vpterdatahouse.com',
            'category' => 'Email Action',
            'created_at' => date('Y-m-d H:i:s', strtotime('-3 days')),
            'action_type' => 'email_response',
            'status' => 'completed'
        ]
    ];
    
    echo json_encode($posts);
}

// Function to get a specific post by ID
function getPostById($id) {
    // This would normally query your database
    $posts = [
        // Same sample posts as above
    ];
    
    $post = null;
    foreach ($posts as $p) {
        if ($p['id'] == $id) {
            $post = $p;
            break;
        }
    }
    
    if ($post) {
        echo json_encode($post);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Post not found']);
    }
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
    // For now, just return success
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => "Post $postId marked as complete"]);
}

// Function to get comments for a post
function getCommentsByPostId($postId) {
    // This would normally query your database
    $comments = [
        [
            'id' => 1,
            'post_id' => 1,
            'user_id' => 'john@example.com',
            'content' => 'I\'ll take a look at this issue right away.',
            'created_at' => date('Y-m-d H:i:s', strtotime('-1 hour'))
        ],
        [
            'id' => 2,
            'post_id' => 1,
            'user_id' => 'admin@example.com',
            'content' => 'Thanks John, please update when resolved.',
            'created_at' => date('Y-m-d H:i:s', strtotime('-30 minutes'))
        ]
    ];
    
    // Filter comments for the requested post
    $filtered_comments = array_filter($comments, function($comment) use ($postId) {
        return $comment['post_id'] == $postId;
    });
    
    echo json_encode(array_values($filtered_comments));
}

// Function to add a comment
function addComment() {
    $data = json_decode(file_get_contents('php://input'), true);
    $postId = isset($data['post_id']) ? $data['post_id'] : null;
    $userId = isset($data['user_id']) ? $data['user_id'] : null;
    $content = isset($data['content']) ? $data['content'] : null;
    
    if (!$postId || !$userId || !$content) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    // In a real app, you would insert into your database here
    // For now, just return success with a mock comment object
    $newComment = [
        'id' => rand(100, 999),
        'post_id' => $postId,
        'user_id' => $userId,
        'content' => $content,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    http_response_code(201);
    echo json_encode(['success' => true, 'comment' => $newComment]);
}
