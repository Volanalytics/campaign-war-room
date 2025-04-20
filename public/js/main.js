// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
  console.log('Action Hub initialized');
  
  // Load the Supabase posts
  loadPosts();
  
  // Setup event listeners
  setupEventListeners();
});

// Function to load posts from Supabase
async function loadPosts() {
  try {
    // Show loading indicator
    document.getElementById('post-loading').style.display = 'block';
    document.getElementById('posts-container').innerHTML = '';
    
    // Fetch posts from Supabase
    const posts = await fetchPosts();
    
    // Render the posts
    renderPosts(posts);
  } catch (error) {
    console.error('Error loading posts:', error);
    document.getElementById('post-loading').style.display = 'none';
    document.getElementById('posts-container').innerHTML = 
      '<div class="alert alert-danger">Error loading posts. Please try again later.</div>';
  }
}

// Set up event listeners for the UI
function setupEventListeners() {
  // Category filter
  const categoryItems = document.querySelectorAll('#categories-list .sidebar-item');
  categoryItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove active class from all items
      categoryItems.forEach(i => i.classList.remove('active'));
      // Add active class to clicked item
      this.classList.add('active');
      
      // Get category name
      const categoryText = this.querySelector('span:first-child').textContent.trim();
      
      // Filter posts based on category
      filterPostsByCategory(categoryText);
    });
  });
  
  // Sort dropdown
  const sortItems = document.querySelectorAll('#sortDropdown + .dropdown-menu .dropdown-item');
  sortItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all items
      sortItems.forEach(i => i.classList.remove('active'));
      // Add active class to clicked item
      this.classList.add('active');
      
      // Get sort option
      const sortOption = this.textContent.trim();
      
      // Sort posts
      sortPosts(sortOption);
    });
  });
}

// Function to mark a post as complete
async function markAsComplete(postId) {
  const success = await markPostAsComplete(postId);
  if (success) {
    alert(`Post ${postId} marked as complete!`);
    // Reload posts to reflect the change
    loadPosts();
  } else {
    alert('Failed to mark post as complete. Please try again.');
  }
}

// Function to filter posts by category
function filterPostsByCategory(category) {
  // Get all post cards
  const posts = document.querySelectorAll('.post-card');
  
  // If "All Posts" is selected, show all posts
  if (category.includes('All Posts')) {
    posts.forEach(post => post.style.display = 'block');
    return;
  }
  
  // Otherwise, filter by the selected category
  posts.forEach(post => {
    const postCategory = post.querySelector('.category-badge').textContent.trim();
    if (category.includes(postCategory)) {
      post.style.display = 'block';
    } else {
      post.style.display = 'none';
    }
  });
}

// Function to sort posts
function sortPosts(sortOption) {
  const postsContainer = document.getElementById('posts-container');
  const posts = Array.from(postsContainer.querySelectorAll('.post-card'));
  
  // Sort posts based on the selected option
  if (sortOption === 'Newest first') {
    posts.sort((a, b) => {
      const dateA = new Date(a.dataset.createdAt);
      const dateB = new Date(b.dataset.createdAt);
      return dateB - dateA;
    });
  } else if (sortOption === 'Oldest first') {
    posts.sort((a, b) => {
      const dateA = new Date(a.dataset.createdAt);
      const dateB = new Date(b.dataset.createdAt);
      return dateA - dateB;
    });
  } else if (sortOption === 'Priority') {
    posts.sort((a, b) => {
      const categoryA = a.querySelector('.category-badge').textContent.trim();
      const categoryB = b.querySelector('.category-badge').textContent.trim();
      
      // Define priority order
      const priority = {
        'Urgent': 1,
        'Email Action': 2,
        'Social Media': 3,
        'General': 4
      };
      
      return (priority[categoryA] || 999) - (priority[categoryB] || 999);
    });
  }
  
  // Re-append the sorted posts
  posts.forEach(post => postsContainer.appendChild(post));
}
