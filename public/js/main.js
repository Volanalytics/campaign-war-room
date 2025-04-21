// Main JavaScript file for Action Hub
document.addEventListener('DOMContentLoaded', function() {
    console.log('Action Hub initialized');
    
    // Fetch posts when the page loads
    fetchPosts();
    
    // Setup event listeners for modals
    setupModalListeners();
});

// Function to setup modal event listeners
function setupModalListeners() {
    // New Action modal
    const newActionBtn = document.getElementById('newActionBtn');
    if (newActionBtn) {
        newActionBtn.addEventListener('click', function() {
            openModal('newActionModal');
        });
    }
    
    // Close buttons for modals
    const closeButtons = document.querySelectorAll('.modal .btn-close, .modal .close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            closeModal(modalId);
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
}

// Function to open a modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Add backdrop if it doesn't exist
        if (!document.querySelector('.modal-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.classList.add('modal-backdrop', 'fade', 'show');
            document.body.appendChild(backdrop);
        }
    }
}

// Function to close a modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        // Remove backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }
}

// Function to fetch posts from the API
async function fetchPosts() {
    document.getElementById('post-loading').style.display = 'block';
    
    try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        console.log('Posts:', posts);
        renderPosts(posts);
        
        // Load comments for each post
        posts.forEach(post => {
            loadComments(post.id);
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        document.getElementById('post-loading').style.display = 'none';
        document.getElementById('posts-container').innerHTML = 
            '<div class="alert alert-danger">Error loading posts. Please try again later.</div>';
    }
}

// Function to render posts
function renderPosts(posts) {
    const postsContainer = document.getElementById('posts-container');
    document.getElementById('post-loading').style.display = 'none';
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<div class="alert alert-info">No posts yet. Send an email to create the first post!</div>';
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
            <div class="card post-card" id="post-${post.id}">
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
                        <div class="post-content">${post.content}</div>
                    </div>
                    
                    ${generateActionWidget(post)}
                    
                    <!-- Comments section -->
                    <div class="comments-section mt-3">
                        <h6>Comments</h6>
                        <div class="comments-list">
                            <!-- Comments will be loaded here -->
                            <div class="text-muted small">Loading comments...</div>
                        </div>
                        <div class="input-group mt-2">
                            <input type="text" class="form-control" placeholder="Add a comment...">
                            <button class="btn btn-outline-primary" onclick="addComment(${post.id})">
                                <i class="bi bi-send"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    postsContainer.innerHTML = html;
    
    // Update category counts
    updateCategoryCounts(posts);
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
                    <select class="form-select status-select" data-post-id="${post.id}">
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
            const shareText = encodeURIComponent(post.content);
            widgetHTML += `
                <h5>Social Media Actions</h5>
                <div class="mb-3">
                    <p>Share this announcement on your social platforms:</p>
                    <div class="p-2 border rounded bg-light">
                        ${post.content}
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
    // Count posts by category
    const categoryCounts = { 'All': posts.length };
    posts.forEach(post => {
        if (post.category) {
            categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
        }
    });
    
    // Update the "All" count
    const allCountElement = document.getElementById('all-count');
    if (allCountElement) {
        allCountElement.textContent = categoryCounts['All'] || 0;
    }
    
    // Update other category counts
    const categoryElements = document.querySelectorAll('#categories-list .sidebar-item');
    categoryElements.forEach(element => {
        const categoryText = element.querySelector('span:first-child').textContent.trim();
        let category = '';
        
        if (categoryText.includes('Urgent')) {
            category = 'Urgent';
        } else if (categoryText.includes('Email Action')) {
            category = 'Email Action';
        } else if (categoryText.includes('Social Media')) {
            category = 'Social Media';
        }
        
        if (category && element.querySelector('.badge')) {
            element.querySelector('.badge').textContent = categoryCounts[category] || 0;
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
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Mark complete result:', result);
        
        if (result.success) {
            // Update the UI to show the post as completed
            const postElement = document.getElementById(`post-${postId}`);
            if (postElement) {
                const statusBadge = postElement.querySelector('.badge');
                if (statusBadge) {
                    statusBadge.className = 'badge bg-secondary me-1';
                    statusBadge.textContent = 'Completed';
                }
            }
            
            // Show a success message
            showToast('Success', `Post ${postId} marked as complete!`);
        }
    } catch (error) {
        console.error('Error marking post as complete:', error);
        showToast('Error', 'Failed to mark post as complete. Please try again.');
    }
}

// Function to assign a post to a team member
function assignToTeam(postId) {
    // In a real implementation, this would open a team selection modal
    showToast('Info', `Post ${postId} ready to be assigned. Team selection would open here.`);
}

// Function to send an email response
function sendEmailResponse(postId) {
    const textarea = document.querySelector(`#post-${postId} textarea`);
    if (!textarea) return;
    
    const response = textarea.value.trim();
    if (response) {
        // In a real implementation, this would send the email and update the database
        showToast('Success', 'Email response sent successfully!');
        markAsComplete(postId);
    } else {
        showToast('Warning', 'Please write a response first');
    }
}

// Function to show a toast notification
function showToast(title, message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${title}</strong>
            <small>Just now</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize and show the toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// Comments functionality
async function loadComments(postId) {
    try {
        const response = await fetch(`/api/comments/${postId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const comments = await response.json();
        renderComments(postId, comments);
    } catch (error) {
        console.error(`Error loading comments for post ${postId}:`, error);
        const commentsContainer = document.querySelector(`#post-${postId} .comments-list`);
        if (commentsContainer) {
            commentsContainer.innerHTML = '<div class="text-muted small">Unable to load comments</div>';
        }
    }
}

function renderComments(postId, comments) {
    const commentsContainer = document.querySelector(`#post-${postId} .comments-list`);
    if (!commentsContainer) return;
    
    if (comments.length === 0) {
        commentsContainer.innerHTML = '<div class="text-muted small">No comments yet</div>';
        return;
    }
    
    let html = '';
    comments.forEach(comment => {
        html += `
            <div class="comment d-flex mb-2">
                <div class="user-avatar bg-light text-dark me-2" style="width: 28px; height: 28px; font-size: 12px;">
                    ${getInitials(comment.user_id)}
                </div>
                <div>
                    <div class="fw-bold small">${comment.user_id}</div>
                    <div class="small">${comment.content}</div>
                    <div class="text-muted x-small">${formatDate(comment.created_at)}</div>
                </div>
            </div>
        `;
    });
    
    commentsContainer.innerHTML = html;
}

async function addComment(postId) {
    const inputElement = document.querySelector(`#post-${postId} .input-group input`);
    if (!inputElement) return;
    
    const content = inputElement.value.trim();
    if (!content) {
        showToast('Warning', 'Please enter a comment');
        return;
    }
    
    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_id: postId,
                content: content,
                user_id: 'current.user@example.com' // In a real app, this would be the logged-in user
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
            // Clear the input field
            inputElement.value = '';
            
            // Reload comments
            loadComments(postId);
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        showToast('Error', 'Failed to add comment. Please try again.');
    }
}

// Add event listeners for status select changes
document.addEventListener('change', function(e) {
    if (e.target && e.target.classList.contains('status-select')) {
        const postId = e.target.getAttribute('data-post-id');
        const status = e.target.value;
        
        if (postId && status) {
            updatePostStatus(postId, status);
        }
    }
});

// Function to update post status
async function updatePostStatus(postId, status) {
    try {
        // In a real implementation, this would call an API endpoint
        console.log(`Updating post ${postId} status to ${status}`);
        showToast('Success', `Status updated to: ${status}`);
        
        // If status is "resolved", mark the post as complete
        if (status === 'resolved') {
            markAsComplete(postId);
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Error', 'Failed to update status. Please try again.');
    }
}
