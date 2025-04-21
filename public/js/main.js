// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    console.log('Action Hub initialized');
    
    // Fetch posts on load
    fetchPosts();
    
    // Set up event listeners for the sidebar filters
    setupSidebarFilters();
    
    // Set up event listener for the sort dropdown
    setupSortDropdown();
});

// Function to fetch posts
async function fetchPosts(category = null, sort = 'newest') {
    // Show loading indicator
    document.getElementById('post-loading').style.display = 'block';
    document.getElementById('posts-container').innerHTML = '';
    
    // Build query parameters
    let queryParams = new URLSearchParams();
    if (category && category !== 'All Posts') {
        queryParams.append('category', category.replace(' Posts', '').trim());
    }
    queryParams.append('sort', sort);
    
    try {
        const response = await fetch(`/api/posts?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Posts:', data);
        
        // Render the posts
        renderPosts(data);
    } catch (error) {
        console.error('Error fetching posts:', error);
        document.getElementById('post-loading').style.display = 'none';
        document.getElementById('posts-container').innerHTML = 
            '<div class="alert alert-danger">Error loading posts. Please try again later.</div>';
    }
}

// Function to set up sidebar filters
function setupSidebarFilters() {
    const categoryItems = document.querySelectorAll('#categories-list .sidebar-item');
    
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            categoryItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get the category name from the item text
            const categoryText = this.querySelector('span:first-child').textContent.trim();
            
            // Fetch posts with the selected category
            fetchPosts(categoryText);
        });
    });
}

// Function to set up sort dropdown
function setupSortDropdown() {
    const sortItems = document.querySelectorAll('#sortDropdown + .dropdown-menu .dropdown-item');
    
    sortItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            sortItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Update the dropdown button text
            document.getElementById('sortDropdown').textContent = this.textContent;
            
            // Get the active category
            const activeCategory = document.querySelector('#categories-list .sidebar-item.active span:first-child').textContent.trim();
            
            // Get the sort value
            let sortValue;
            if (this.textContent.includes('Newest')) {
                sortValue = 'newest';
            } else if (this.textContent.includes('Oldest')) {
                sortValue = 'oldest';
            } else if (this.textContent.includes('Priority')) {
                sortValue = 'priority';
            }
            
            // Fetch posts with the selected sort
            fetchPosts(activeCategory, sortValue);
        });
    });
}

// Function to generate action widgets based on post type
function generateActionWidget(post) {
    let widgetHTML = '<div class="action-widget">';
    
    switch(post.action_type) {
        case 'technical_support':
            widgetHTML += `
                <h5>Technical Support Actions</h5>
                <div class="mb-3">
                    <label class="form-label">Status Update</label>
                    <select class="form-select">
                        <option value="investigating" selected>Investigating</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" onclick="markAsComplete(${post.id})">Mark as Complete</button>
                    <button class="btn btn-outline-secondary" onclick="assignToTeam(${post.id})">Assign to Team</button>
                </div>
            `;
            break;
            
        case 'social_share':
            const contentLines = post.content.split('\n\n');
            let shareText = '';
            
            // Try to find shareable content - this is a simplified approach
            for (let i = 0; i < contentLines.length; i++) {
                if (contentLines[i].includes('share') || contentLines[i].includes('post')) {
                    // Take the next line as the shareable content
                    if (i + 1 < contentLines.length) {
                        shareText = encodeURIComponent(contentLines[i + 1].replace(/'/g, ''));
                        break;
                    }
                }
            }
            
            // If we couldn't find specific content, use the whole thing
            if (!shareText) {
                shareText = encodeURIComponent(post.content.replace(/'/g, '').substring(0, 240));
            }
            
            widgetHTML += `
                <h5>Social Media Actions</h5>
                <div class="mb-3">
                    <p>Share this announcement on your social platforms:</p>
                    <div class="p-2 border rounded bg-light">
                        ${shareText ? decodeURIComponent(shareText) : post.content}
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <a href="https://twitter.com/intent/tweet?text=${shareText}" target="_blank" class="btn btn-primary">
                        <i class="bi bi-twitter"></i> Share on Twitter
                    </a>
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://vpterdatahouse.com&summary=${shareText}" target="_blank" class="btn btn-outline-primary">
                        <i class="bi bi-linkedin"></i> Share on LinkedIn
                    </a>
                    <button class="btn btn-outline-secondary" onclick="markAsComplete(${post.id})">Mark as Shared</button>
                </div>
            `;
            break;
            
        case 'email_response':
            widgetHTML += `
                <h5>Email Response Actions</h5>
                <div class="mb-3">
                    <label class="form-label">Draft Response</label>
                    <textarea class="form-control" rows="4" placeholder="Type your response here..."></textarea>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" onclick="sendEmailResponse(${post.id})">
                        <i class="bi bi-envelope"></i> Send Response
                    </button>
                    <button class="btn btn-outline-secondary" onclick="assignToTeam(${post.id})">
                        <i class="bi bi-people"></i> Assign to Team
                    </button>
                </div>
            `;
            break;
            
        default:
            widgetHTML += `
                <h5>Actions</h5>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" onclick="markAsComplete(${post.id})">Take Action</button>
                    <button class="btn btn-outline-secondary" onclick="assignToTeam(${post.id})">Assign to Team</button>
                </div>
            `;
    }
    
    widgetHTML += '</div>';
    return widgetHTML;
}

// Function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `Today at ${hours}:${minutes}`;
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return date.toLocaleString('en-us', { weekday: 'long' });
    } else {
        return date.toLocaleDateString();
    }
}

// Function to render posts
function renderPosts(posts) {
    const postsContainer = document.getElementById('posts-container');
    document.getElementById('post-loading').style.display = 'none';
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<div class="alert alert-info">No posts found. Try a different filter or send an email to create a new post!</div>';
        return;
    }
    
    let html = '';
    posts.forEach(post => {
        const formattedDate = formatDate(post.created_at);
        let statusBadge = '';
        
        if (post.status === 'new') {
            statusBadge = '<span class="badge bg-success me-1">New</span>';
        } else if (post.status === 'completed') {
            statusBadge = '<span class="badge bg-secondary me-1">Completed</span>';
        }
        
        html += `
            <div class="card post-card">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <div>
                        ${statusBadge}
                        <span class="badge bg-${getCategoryColor(post.category)} category-badge me-2">${post.category}</span>
                        <strong>${post.title}</strong>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-link text-muted" type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#"><i class="bi bi-bookmark-plus"></i> Save</a></li>
                            <li><a class="dropdown-item" href="#"><i class="bi bi-forward"></i> Forward</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#"><i class="bi bi-archive"></i> Archive</a></li>
                        </ul>
                    </div>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <div class="d-flex align-items-center mb-2">
                            <div class="user-avatar bg-secondary me-2">
                                ${getInitials(post.sender)}
                            </div>
                            <div>
                                <div class="fw-bold">${post.sender}</div>
                                <div class="text-muted small">to ${post.recipient}</div>
                            </div>
                            <div class="ms-auto text-muted small">
                                ${formattedDate}
                            </div>
                        </div>
                        <div class="post-content">${post.content.replace(/\n/g, '<br>')}</div>
                    </div>
                    
                    ${generateActionWidget(post)}
                </div>
            </div>
        `;
    });
    
    postsContainer.innerHTML = html;
    
    // Update category counts
    updateCategoryCounts(posts);
}

// Function to get initials from email address
function getInitials(email) {
    const name = email.split('@')[0];
    if (name.includes('.')) {
        const parts = name.split('.');
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Function to get appropriate color for category badge
function getCategoryColor(category) {
    switch(category) {
        case 'Urgent': return 'danger';
        case 'Social Media': return 'info';
        case 'Email Action': return 'warning';
        default: return 'primary';
    }
}

// Function to update category counts
function updateCategoryCounts(posts) {
    // Count all posts
    const allCount = posts.length;
    document.getElementById('all-count').textContent = allCount;
    
    // Count posts by category
    const categoryCounts = {};
    posts.forEach(post => {
        if (post.category) {
            categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
        }
    });
    
    // Update category counts in the sidebar
    const categoryElements = document.querySelectorAll('#categories-list .sidebar-item');
    categoryElements.forEach(element => {
        const category = element.querySelector('span:first-child').textContent.trim();
        
        if (category.includes('Urgent')) {
            element.querySelector('.badge').textContent = categoryCounts['Urgent'] || 0;
        } else if (category.includes('Email Action')) {
            element.querySelector('.badge').textContent = categoryCounts['Email Action'] || 0;
        } else if (category.includes('Social Media')) {
            element.querySelector('.badge').textContent = categoryCounts['Social Media'] || 0;
        }
    });
}

// Function to mark a post as complete
async function markAsComplete(postId) {
    try {
        const response = await fetch('/api/mark-complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ post_id: postId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success - refresh the posts
            alert(`Post ${postId} marked as complete!`);
            
            // Get the active category and sort
            const activeCategory = document.querySelector('#categories-list .sidebar-item.active span:first-child').textContent.trim();
            const sortDropdown = document.querySelector('#sortDropdown + .dropdown-menu .dropdown-item.active');
            let sortValue = 'newest';
            
            if (sortDropdown) {
                if (sortDropdown.textContent.includes('Oldest')) {
                    sortValue = 'oldest';
                } else if (sortDropdown.textContent.includes('Priority')) {
                    sortValue = 'priority';
                }
            }
            
            // Refresh the posts
            fetchPosts(activeCategory, sortValue);
        } else {
            // Error
            alert(`Error: ${data.error || 'Failed to mark post as complete'}`);
        }
    } catch (error) {
        console.error('Error marking post as complete:', error);
        alert('An error occurred. Please try again later.');
    }
}

// Function to assign to team (stub for now)
function assignToTeam(postId) {
    alert(`Post ${postId} ready to be assigned. Team selection would open here.`);
    // In a real implementation, this would open a team selection dialog
}

// Function to send email response (stub for now)
function sendEmailResponse(postId) {
    const postCard = document.querySelector(`.post-card:has(button[onclick="sendEmailResponse(${postId})"])`);
    const textarea = postCard.querySelector('textarea');
    const response = textarea.value.trim();
    
    if (response) {
        alert(`Email response submitted: ${response}`);
        // In a real implementation, this would send the email and update the database
        markAsComplete(postId);
    } else {
        alert('Please write a response first');
    }
}
