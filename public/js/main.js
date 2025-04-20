// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    console.log('Action Hub initialized');
    
    // Your JavaScript code will go here
    
    // Example function to fetch posts
    async function fetchPosts() {
        try {
            const response = await fetch('/api/posts');
            const data = await response.json();
            console.log('Posts:', data);
            // Update UI with posts data
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    }
});
