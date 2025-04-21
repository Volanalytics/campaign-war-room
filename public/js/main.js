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
    
    try {
        // Use the supabaseClient defined in your auth.js file
        let query = supabaseClient.from('posts').select('*');
        
        // Add category filter if provided
        if (category && category !== 'All Posts' && category !== 'All Actions') {
            const categoryName = category.replace(' Posts', '').trim();
            query = query.eq('category', categoryName);
        }
        
        // Add sorting
        if (sort === 'newest') {
            query = query.order('created_at', { ascending: false });
        } else if (sort === 'oldest') {
            query = query.order('created_at', { ascending: true });
        } else if (sort === 'priority') {
            // For priority sorting, we need to handle this after fetching the data
            // Since Supabase doesn't support custom sort expressions easily
        }
        
        // Execute the query
        const { data, error } = await query;
        
        if (error) {
            throw new Error(`Supabase error: ${error.message}`);
        }
        
        // Apply priority sorting if needed (Urgent category first)
        if (sort === 'priority') {
            data.sort((a, b) => {
                if (a.category === 'Urgent' && b.category !== 'Urgent') return -1;
                if (a.category !== 'Urgent' && b.category === 'Urgent') return 1;
                // If both are urgent or both are not, sort by date (newest first)
                return new Date(b.created_at) - new Date(a.created_at);
            });
        }
        
        console.log('Posts:', data);
        
        // Render the posts
        renderPosts(data && data.length ? data : []);
    } catch (error) {
        console.error('Error fetching posts:', error);
        
        // For development/debugging - display more information about the error
        document.getElementById('post-loading').style.display = 'none';
        document.getElementById('posts-container').innerHTML = 
            `<div class="alert alert-danger">
                <p>Error loading posts. Please try again later.</p>
                <p><strong>Error details:</strong> ${error.message}</p>
            </div>`;
            
        // Fall back to sample data for development
        console.log('Loading sample data for development...');
        loadSamplePosts();
    }
}

// Function to mark a post as complete
async function markAsComplete(postId) {
    try {
        // Update the post status in Supabase
        const { data, error } = await supabaseClient
            .from('posts')
            .update({ 
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('id', postId);
            
        if (error) {
            throw new Error(`Supabase error: ${error.message}`);
        }
        
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
    } catch (error) {
        console.error('Error marking post as complete:', error);
        alert(`An error occurred: ${error.message}`);
    }
}

// Function to load sample data for development/testing
function loadSamplePosts() {
    const samplePosts = [
        {
            id: 1,
            title: "Urgent: Website Down Issue",
            content: "The client website at client.example.com is currently down. Initial investigation shows it might be a database connection issue. Need someone to look at this immediately.\n\nError log shows: Connection refused (111)",
            sender: "support@vpterdatahouse.com",
            recipient: "info@vpterdatahouse.com",
            category: "Urgent",
            created_at: "2025-04-19T10:23:00",
            action_type: "technical_support",
            status: "new"
        },
        {
            id: 2,
            title: "Help spread the word: New product launch next week",
            content: "We're launching our new data visualization tool next week and need help spreading the word on social media.\n\nHere's the announcement text to share:\n\n'Excited to announce our new DataViz Pro tool launching next Tuesday! Real-time dashboards for your most complex datasets. #DataVisualization #Analytics'",
            sender: "marketing@vpterdatahouse.com",
            recipient: "info@vpterdatahouse.com",
            category: "Social Media",
            created_at: "2025-04-18T15:45:00",
            action_type: "social_share",
            status: "new"
        },
        {
            id: 3,
            title: "Client Email Response Needed: Project Timeline",
            content: "The client has asked for an updated timeline on the data migration project. Can someone from the project team draft a response outlining our current progress and expected completion dates?\n\nSpecifically they want to know:\n1. When the schema mapping will be completed\n2. Expected start date for the test migration\n3. Final migration timeline",
            sender: "accounts@vpterdatahouse.com",
            recipient: "info@vpterdatahouse.com",
            category: "Email Action",
            created_at: "2025-04-17T09:30:00",
            action_type: "email_response",
            status: "completed"
        }
    ];
    
    renderPosts(samplePosts);
}

// Rest of the JavaScript remains the same
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
        const apiBase = '/server/api'; // Match the same base as fetchPosts
        
        const response = await fetch(`${apiBase}/mark-complete`, {
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
    if (!postCard) {
        const textarea = document.querySelector(`textarea`);
        if (textarea) {
            const response = textarea.value.trim();
            if (response) {
                alert(`Email response submitted: ${response}`);
                markAsComplete(postId);
            } else {
                alert('Please write a response first');
            }
        } else {
            alert('Could not find the response text area.');
        }
    } else {
        const textarea = postCard.querySelector('textarea');
        const response = textarea.value.trim();
        
        if (response) {
            alert(`Email response submitted: ${response}`);
            markAsComplete(postId);
        } else {
            alert('Please write a response first');
        }
    }
}

// Add this code to your main.js file or to a separate script file that's included in your HTML

document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up New Action button handler');
    
    // Get the New Action button
    const newActionButton = document.querySelector('button[data-bs-toggle="modal"][data-bs-target="#newPostModal"]');
    
    // If the button uses a different selector, try one of these:
    // const newActionButton = document.getElementById('newActionButton');
    // const newActionButton = document.querySelector('.btn-primary:contains("New Action")');
    // const newActionButton = document.querySelector('[data-bs-target="#newPostModal"]');
    
    if (newActionButton) {
        console.log('New Action button found');
        
        // Ensure the button is properly set up for Bootstrap modal
        if (!newActionButton.hasAttribute('data-bs-toggle') || !newActionButton.hasAttribute('data-bs-target')) {
            newActionButton.setAttribute('data-bs-toggle', 'modal');
            newActionButton.setAttribute('data-bs-target', '#newPostModal');
        }
        
        // Add a click event listener as a backup
        newActionButton.addEventListener('click', function(event) {
            console.log('New Action button clicked');
            
            // Try to open the modal using Bootstrap's API
            try {
                const myModal = new bootstrap.Modal(document.getElementById('newPostModal'));
                myModal.show();
            } catch (error) {
                console.error('Error opening modal:', error);
                
                // Fallback: try direct manipulation if Bootstrap API fails
                const modal = document.getElementById('newPostModal');
                if (modal) {
                    modal.classList.add('show');
                    modal.style.display = 'block';
                    document.body.classList.add('modal-open');
                    
                    // Add backdrop
                    const backdrop = document.createElement('div');
                    backdrop.className = 'modal-backdrop fade show';
                    document.body.appendChild(backdrop);
                }
            }
        });
    } else {
        console.warn('New Action button not found');
    }
    
    // Also ensure the form submission in the modal works
    const newPostForm = document.getElementById('newPostForm');
    if (newPostForm) {
        console.log('New Post form found');
        
        newPostForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('Form submitted');
            
            // Get form data
            const formData = new FormData(newPostForm);
            const postData = {
                title: formData.get('title'),
                content: formData.get('content'),
                category: formData.get('category'),
                action_type: determineActionType(formData.get('title'), formData.get('content')),
                sender: 'user@voterdatahouse.com',
                recipient: 'team@voterdatahouse.com',
                status: 'new',
                created_at: new Date().toISOString()
            };
            
            console.log('New post data:', postData);
            
            // Add the new post to the UI
            addNewPost(postData);
            
            // Close the modal
            const myModal = bootstrap.Modal.getInstance(document.getElementById('newPostModal'));
            if (myModal) {
                myModal.hide();
            } else {
                // Fallback if Bootstrap API isn't available
                document.getElementById('newPostModal').classList.remove('show');
                document.getElementById('newPostModal').style.display = 'none';
                document.body.classList.remove('modal-open');
                
                // Remove backdrop
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
            }
            
            // Reset the form
            newPostForm.reset();
        });
    } else {
        console.warn('New Post form not found');
    }
});

// Function to add a new post to the UI
function addNewPost(postData) {
    // Generate a unique ID for the new post
    postData.id = Date.now();
    
    // Create the HTML for the new post
    const formattedDate = formatDate(postData.created_at);
    let statusBadge = '<span class="badge bg-success me-1">New</span>';
    
    const postHtml = `
        <div class="card post-card">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <div>
                    ${statusBadge}
                    <span class="badge bg-${getCategoryColor(postData.category)} category-badge me-2">${postData.category}</span>
                    <strong>${postData.title}</strong>
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
                            ${getInitials(postData.sender)}
                        </div>
                        <div>
                            <div class="fw-bold">${postData.sender}</div>
                            <div class="text-muted small">to ${postData.recipient}</div>
                        </div>
                        <div class="ms-auto text-muted small">
                            ${formattedDate}
                        </div>
                    </div>
                    <div class="post-content">${postData.content.replace(/\n/g, '<br>')}</div>
                </div>
                
                ${generateActionWidget(postData)}
            </div>
        </div>
    `;
    
    // Add the new post to the beginning of the posts container
    const postsContainer = document.getElementById('posts-container');
    postsContainer.insertAdjacentHTML('afterbegin', postHtml);
    
    // Update the category counts
    const allPosts = document.querySelectorAll('.post-card');
    updateCategoryCounts(Array.from(allPosts).map(post => {
        // Extract category from the post
        const categoryBadge = post.querySelector('.category-badge');
        return {
            category: categoryBadge ? categoryBadge.textContent : 'General'
        };
    }));
}

// Helper function to determine action type based on content
function determineActionType(title, content) {
    const combinedText = (title + ' ' + content).toLowerCase();
    
    if (combinedText.includes('urgent') || combinedText.includes('emergency') || combinedText.includes('asap')) {
        return 'technical_support';
    } else if (combinedText.includes('share') || combinedText.includes('post') || combinedText.includes('social media')) {
        return 'social_share';
    } else if (combinedText.includes('respond') || combinedText.includes('reply') || combinedText.includes('email')) {
        return 'email_response';
    }
    
    return 'general';
}
