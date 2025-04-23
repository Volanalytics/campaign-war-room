// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    console.log('Action Hub initialized');
    
    // Fetch posts on load
    fetchPosts();
    
    // Set up event listeners for the sidebar filters
    setupSidebarFilters();
    
    // Set up event listener for the sort dropdown
    setupSortDropdown();
    
    // Set up modal event handlers
    setupModalEvents();
    
    // Set up New Action button handler
    setupNewActionButton();
    
    // Add comments to posts after they load
    setTimeout(addCommentsToExistingPosts, 1000);
    
    // Set up team assignment functionality
    const confirmAssignButton = document.getElementById('confirmAssignButton');
    if (confirmAssignButton) {
        confirmAssignButton.addEventListener('click', confirmAssignment);
    }
    
    // Load team members when the page loads
    loadTeamMembers();
});

// Function to set up modal event handlers
function setupModalEvents() {
    // Get all modals
    const modals = document.querySelectorAll('.modal');
    
    // Add event listeners to each modal
    modals.forEach(modal => {
        // Store the element that had focus before opening the modal
        let previouslyFocusedElement = null;
        
        // When the modal is shown
        modal.addEventListener('show.bs.modal', function() {
            // Save the current focus
            previouslyFocusedElement = document.activeElement;
        });
        
        // When the modal is hidden
        modal.addEventListener('hidden.bs.modal', function() {
            // Remove modal backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            
            // Remove modal-open class and inline styles from body
            document.body.classList.remove('modal-open');
            document.body.removeAttribute('style');
            
            // Ensure no elements inside the modal have focus
            const focusedElement = modal.querySelector(':focus');
            if (focusedElement) {
                focusedElement.blur();
            }
            
            // Return focus to the element that had focus before the modal was opened
            if (previouslyFocusedElement) {
                // Small delay to ensure the modal is fully hidden
                setTimeout(() => {
                    previouslyFocusedElement.focus();
                }, 10);
            }
        });
        
        // Close buttons for modals
        const closeButtons = modal.querySelectorAll('.btn-close, .close-btn, .btn-secondary[data-bs-dismiss="modal"]');
        closeButtons.forEach(button => {
            button.addEventListener('mousedown', function() {
                // Use mousedown instead of click to catch the event before the modal starts closing
                this.blur();
                
                // Force focus somewhere else
                document.body.focus();
                
                // For modals with forms, try to reset the form
                const form = this.closest('.modal').querySelector('form');
                if (form) form.reset();
            });
        });
    });
    
    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
}

// Function to properly close a modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Try to use Bootstrap's API first
    try {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
            return;
        }
    } catch (error) {
        console.warn('Bootstrap Modal API not available, using fallback', error);
    }
    
    // Fallback: hide the modal manually
    modal.style.display = 'none';
    modal.classList.remove('show');
    
    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    
    // Remove the backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
    
    // Remove any inline styles that Bootstrap might have added
    document.body.removeAttribute('style');
}

// Function to set up the New Action button
function setupNewActionButton() {
    // Get the New Action button
    const newActionButton = document.querySelector('button[data-bs-toggle="modal"][data-bs-target="#newPostModal"]');
    
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
            closeModal('newPostModal');
            
            // Reset the form
            newPostForm.reset();
        });
    } else {
        console.warn('New Post form not found');
    }
    
    // Get the submit button for the new post form
    const submitButton = document.getElementById('submitNewPost');
    
    if (submitButton) {
        console.log('Submit button found: #submitNewPost');
        
        submitButton.addEventListener('click', function() {
            console.log('Submit button clicked');
            
            // Get form values
            const title = document.getElementById('postTitle').value;
            const category = document.getElementById('postCategory').value;
            const actionType = document.getElementById('postActionType').value;
            const content = document.getElementById('postContent').value;
            const sender = document.getElementById('postSender').value || 'user@voterdatahouse.com';
            const recipient = document.getElementById('postRecipient').value || 'team@voterdatahouse.com';
            
            // Validate form
            if (!title || !category || !actionType || !content) {
                showToast('Warning', 'Please fill in all required fields');
                return;
            }
            
            // Create post data object
            const postData = {
                title: title,
                content: content,
                category: category,
                action_type: actionType,
                sender: sender,
                recipient: recipient,
                status: 'new',
                created_at: new Date().toISOString()
            };
            
            console.log('Creating new post:', postData);
            
            // Try to save to Supabase if available
            if (typeof supabaseClient !== 'undefined') {
                try {
                    supabaseClient
                        .from('posts')
                        .insert(postData)
                        .then(response => {
                            if (response.error) {
                                console.error('Error inserting post to Supabase:', response.error);
                                // Fall back to adding to UI only with a local ID
                                const localPostData = { ...postData, id: Math.floor(Math.random() * 1000) };
                                addNewPost(localPostData);
                            } else {
                                console.log('Post added to Supabase successfully:', response.data);
                                // Refresh posts to show the new one
                                fetchPosts();
                            }
                        });
                } catch (error) {
                    console.error('Error with Supabase:', error);
                    // Fall back to adding to UI only with a local ID
                    const localPostData = { ...postData, id: Math.floor(Math.random() * 1000) };
                    addNewPost(localPostData);
                }
            } else {
                // If Supabase isn't available, just add to UI with a local ID
                const localPostData = { ...postData, id: Math.floor(Math.random() * 1000) };
                addNewPost(localPostData);
            }
            
            // Close the modal
            closeModal('newPostModal');
            
            // Reset form fields
            document.getElementById('postTitle').value = '';
            document.getElementById('postContent').value = '';
            document.getElementById('postCategory').selectedIndex = 0;
            document.getElementById('postActionType').selectedIndex = 0;
        });
    } else {
        console.warn('Submit button not found: #submitNewPost');
    }
}

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
                        ${decodeURIComponent(shareText)}
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

// Function to format dates (Updated to use local time)
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        // Today - use local time format
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
            <div class="card post-card" id="post-${post.id}" data-post-id="${post.id}">
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
    
    // Add comments to the posts
    setTimeout(addCommentsToExistingPosts, 500);
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
    const allCountElement = document.getElementById('all-count');
    if (allCountElement) {
        allCountElement.textContent = allCount;
    }
    
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

// Updated function to mark a post as complete
async function markAsComplete(postId) {
    try {
        // Update UI first for immediate feedback
        updatePostStatusUI(postId, 'completed');
        
        // Show success toast
        showToast('Success', `Post ${postId} marked as complete!`);
        
        // Try to update Supabase in the background
        if (typeof supabaseClient !== 'undefined') {
            try {
                console.log(`Updating post ${postId} to completed in Supabase`);
                
                const { data, error } = await supabaseClient
                    .from('posts')
                    .update({ 
                        status: 'completed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', postId);
                
                if (error) {
                    console.error('Supabase update error:', error.message);
                    // Don't throw, we'll continue with the API fallback
                } else {
                    console.log('Post marked as complete in Supabase:', data);
                    return; // Success, no need to try the API
                }
            } catch (error) {
                console.error('Error with Supabase update:', error);
                // Fallback to API approach
            }
        }
        
        // Fallback: Try API approach
        try {
            const response = await fetch('/api/mark-complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ post_id: postId })
            });
            
            // Just check if the response is ok, don't try to parse JSON
            if (response.ok) {
                console.log('Post marked as complete via API');
            } else {
                console.error('API error response:', response.status);
            }
        } catch (error) {
            console.error('Error with API call:', error);
            // UI is already updated, so we can silently fail
        }
    } catch (error) {
        console.error('Error in markAsComplete:', error);
        // Even if everything fails, UI is already updated
    }
}

// Function to update post status in the UI
function updatePostStatusUI(postId, status) {
    const postElement = document.getElementById(`post-${postId}`);
    if (!postElement) return;
    
    const statusBadge = postElement.querySelector('.badge');
    if (statusBadge) {
        if (status === 'completed') {
            statusBadge.className = 'badge bg-secondary me-1';
            statusBadge.textContent = 'Completed';
        } else if (status === 'new') {
            statusBadge.className = 'badge bg-success me-1';
            statusBadge.textContent = 'New';
        }
    }
}

// Global variable to store team members data
let teamMembers = [];

// Function to load team members from the sidebar
function loadTeamMembers() {
    teamMembers = [];
    
    // Get team members from the sidebar
    const teamMemberElements = document.querySelectorAll('#team-members .sidebar-item');
    
    teamMemberElements.forEach((element, index) => {
        const avatar = element.querySelector('.user-avatar');
        const name = element.querySelector('span').textContent.trim();
        const role = name.includes('(') ? name.split('(')[1].replace(')', '') : 'Team Member';
        const displayName = name.includes('(') ? name.split('(')[0].trim() : name;
        const isOnline = element.querySelector('.status-indicator') !== null;
        
        const bgClass = avatar.className.match(/bg-(\w+)/);
        const color = bgClass ? bgClass[1] : 'secondary';
        
        teamMembers.push({
            id: index + 1,
            name: displayName,
            role: role,
            avatar: avatar.textContent.trim(),
            online: isOnline,
            color: color
        });
    });
    
    return teamMembers;
}

// Function to handle clicking "Assign to Team" button
function assignToTeam(postId) {
    // Load team members if not already loaded
    if (teamMembers.length === 0) {
        loadTeamMembers();
    }
    
    // Set the current post ID in the hidden field
    document.getElementById('currentPostId').value = postId;
    
    // Populate team members list
    populateTeamMembersList();
    
    // Show the modal
    try {
        const assignModal = new bootstrap.Modal(document.getElementById('assignTeamModal'));
        assignModal.show();
    } catch (error) {
        console.error('Error showing modal:', error);
        
        // Fallback: try direct manipulation if Bootstrap API fails
        const modal = document.getElementById('assignTeamModal');
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
}

// Function to populate team members list in the modal
function populateTeamMembersList() {
    const teamMembersList = document.getElementById('teamMembersList');
    
    // Clear previous content
    teamMembersList.innerHTML = '';
    
    // Add each team member as a selectable option
    teamMembers.forEach(member => {
        const memberOption = document.createElement('div');
        memberOption.className = 'form-check d-flex align-items-center p-2 border rounded mb-2';
        memberOption.innerHTML = `
          <input class="form-check-input me-3" type="checkbox" value="${member.id}" id="member${member.id}">
          <label class="form-check-label d-flex align-items-center flex-grow-1" for="member${member.id}">
            <div class="position-relative me-2">
              <div class="user-avatar bg-${member.color}" style="width: 36px; height: 36px;">${member.avatar}</div>
              ${member.online ? '<div class="status-indicator"></div>' : ''}
            </div>
            <div>
              <div class="fw-bold">${member.name}</div>
              <div class="text-muted small">${member.role}</div>
            </div>
          </label>
        `;
        teamMembersList.appendChild(memberOption);
        
        // Add hover effect
        memberOption.addEventListener('mouseenter', () => {
            memberOption.classList.add('bg-light');
        });
        
        memberOption.addEventListener('mouseleave', () => {
            memberOption.classList.remove('bg-light');
        });
    });
}

// Function to handle the assignment confirmation
function confirmAssignment() {
    const postId = document.getElementById('currentPostId').value;
    const assignmentNote = document.getElementById('assignmentNote').value.trim();
    const selectedMembers = [];
    
    // Get all selected team members
    document.querySelectorAll('#teamMembersList input[type="checkbox"]:checked').forEach(checkbox => {
        const memberId = parseInt(checkbox.value);
        const member = teamMembers.find(m => m.id === memberId);
        if (member) {
            selectedMembers.push(member);
        }
    });
    
    if (selectedMembers.length === 0) {
        // Show error if no team members selected
        showToast('Warning', 'Please select at least one team member to assign.');
        return;
    }
    
    // In a real implementation, this would save to a database
    // For now, we'll update the UI to show assignment
    updatePostAssignment(postId, selectedMembers, assignmentNote);
    
    // Close the modal
    try {
        bootstrap.Modal.getInstance(document.getElementById('assignTeamModal')).hide();
    } catch (error) {
        console.error('Error hiding modal:', error);
        
        // Fallback if Bootstrap API fails
        closeModal('assignTeamModal');
    }
    
    // Show success message
    showToast('Assignment Complete', `Task assigned to ${selectedMembers.map(m => m.name).join(', ')}`);
}

// Function to update the post UI after assignment
function updatePostAssignment(postId, assignedMembers, note) {
    const postCard = document.getElementById(`post-${postId}`);
    if (!postCard) return;
    
    // Find or create assignment section
    let assignmentSection = postCard.querySelector('.assignment-section');
    if (!assignmentSection) {
        const actionWidget = postCard.querySelector('.action-widget');
        if (!actionWidget) return;
        
        assignmentSection = document.createElement('div');
        assignmentSection.className = 'assignment-section mt-3 pt-3 border-top';
        actionWidget.appendChild(assignmentSection);
    }
    
    // Update assignment section content
    assignmentSection.innerHTML = `
        <div class="d-flex align-items-center mb-2">
          <i class="bi bi-people-fill text-primary me-2"></i>
          <strong>Assigned to:</strong>
        </div>
        <div class="d-flex flex-wrap mb-2">
          ${assignedMembers.map(member => `
            <div class="d-flex align-items-center me-3 mb-2">
              <div class="position-relative me-1">
                <div class="user-avatar bg-${member.color}" style="width: 28px; height: 28px; font-size: 0.8em;">${member.avatar}</div>
                ${member.online ? '<div class="status-indicator"></div>' : ''}
              </div>
              <span class="small">${member.name}</span>
            </div>
          `).join('')}
        </div>
        ${note ? `<div class="p-2 bg-light rounded small"><i class="bi bi-quote me-1"></i>${note}</div>` : ''}
    `;
    
    // Update assignment button
    const assignButtons = postCard.querySelectorAll('button');
    assignButtons.forEach(button => {
        if (button.textContent.includes('Assign to Team')) {
            button.innerHTML = '<i class="bi bi-people"></i> Reassign';
        }
    });
    
    // Add status badge to post if not already there
    const headerDiv = postCard.querySelector('.card-header div:first-child');
    if (headerDiv) {
        let hasAssignedBadge = Array.from(headerDiv.querySelectorAll('.badge'))
            .some(badge => badge.textContent.trim() === 'Assigned');
            
        if (!hasAssignedBadge) {
            const assignedBadge = document.createElement('span');
            assignedBadge.className = 'badge bg-info me-1';
            assignedBadge.textContent = 'Assigned';
            
            // Insert after any existing badges
            const firstBadge = headerDiv.querySelector('.badge');
            if (firstBadge) {
                firstBadge.insertAdjacentElement('afterend', assignedBadge);
            } else {
                headerDiv.prepend(assignedBadge);
            }
        }
    }
    
    // Update in Supabase if available
    if (typeof supabaseClient !== 'undefined') {
        try {
            const assignmentData = {
                post_id: postId,
                assigned_to: assignedMembers.map(m => m.id),
                assignment_note: note,
                updated_at: new Date().toISOString()
            };
            
            supabaseClient
                .from('assignments')
                .upsert(assignmentData)
                .then(response => {
                    if (response.error) {
                        console.error('Error saving assignment to Supabase:', response.error);
                    } else {
                        console.log('Assignment saved to Supabase:', response.data);
                    }
                });
        } catch (error) {
            console.error('Error with Supabase assignment:', error);
        }
    }
}

// Function to send email response
function sendEmailResponse(postId) {
    const postCard = document.getElementById(`post-${postId}`);
    if (!postCard) {
        showToast('Error', 'Could not find the post card.');
        return;
    }
    
    const textarea = postCard.querySelector('textarea');
    if (!textarea) {
        showToast('Error', 'Could not find the response text area.');
        return;
    }
    
    const response = textarea.value.trim();
    if (!response) {
        showToast('Warning', 'Please write a response first');
        return;
    }
    
    // In a real implementation, this would send the email
    showToast('Success', 'Email response sent successfully!');
    
    // Mark the post as complete
    markAsComplete(postId);
}

// Function to add a new post to the UI
function addNewPost(postData) {
    // Generate a unique ID for the new post if not provided
    if (!postData.id) {
        postData.id = Date.now();
    }
    
    // Create the HTML for the new post
    const formattedDate = formatDate(postData.created_at);
    let statusBadge = '<span class="badge bg-success me-1">New</span>';
    
    const postHtml = `
        <div class="card post-card" id="post-${postData.id}" data-post-id="${postData.id}">
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
    
    // Check if there's an "alert" div (no posts message)
    const alert = postsContainer.querySelector('.alert');
    if (alert) {
        // Replace the alert with the new post
        postsContainer.innerHTML = postHtml;
    } else {
        // Add the new post to the beginning
        postsContainer.insertAdjacentHTML('afterbegin', postHtml);
    }
    
    // Update the category counts
    const allPosts = document.querySelectorAll('.post-card');
    updateCategoryCounts(Array.from(allPosts).map(post => {
        // Extract category from the post
        const categoryBadge = post.querySelector('.category-badge');
        return {
            category: categoryBadge ? categoryBadge.textContent : 'General'
        };
    }));
    
    // Add comments section to the new post
    setTimeout(() => {
        addCommentsSection(postData.id);
    }, 100);
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

// Show toast notifications
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
    try {
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    } catch (error) {
        console.warn('Bootstrap Toast API not available, using fallback', error);
        // Fallback if Bootstrap API not available
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 150);
        }, 5000);
    }
    
    // Remove toast after it's hidden (for Bootstrap API)
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// Comments functionality
// Function to add comments to existing posts
function addCommentsToExistingPosts() {
    const posts = document.querySelectorAll('.post-card');
    posts.forEach(post => {
        const postId = post.id.replace('post-', '');
        addCommentsSection(postId);
    });
}

// Function to add comments section to a post
function addCommentsSection(postId) {
    const post = document.getElementById(`post-${postId}`);
    if (!post) return;
    
    // Check if comments section already exists
    if (!post.querySelector('.comments-section')) {
        const commentsSection = document.createElement('div');
        commentsSection.className = 'comments-section mt-3';
        commentsSection.innerHTML = `
            <h6>Comments</h6>
            <div class="comments-list">
                <div class="text-muted small">No comments yet</div>
            </div>
            <div class="input-group mt-2">
                <input type="text" class="form-control" placeholder="Add a comment...">
                <button class="btn btn-outline-primary" onclick="addComment(${postId})">
                    <i class="bi bi-send"></i>
                </button>
            </div>
        `;
        
        // Add comments section after the action widget
        const cardBody = post.querySelector('.card-body');
        if (cardBody) {
            cardBody.appendChild(commentsSection);
        }
        
        // Load comments for this post
        loadComments(postId);
    }
}

// Updated function to load comments for a post
async function loadComments(postId) {
    try {
        if (typeof supabaseClient !== 'undefined') {
            try {
                // Try to fetch real comments from Supabase
                console.log(`Fetching comments for post ${postId} from Supabase`);
                const { data, error } = await supabaseClient
                    .from('comments')
                    .select('*')
                    .eq('post_id', postId)
                    .order('created_at', { ascending: true });
                
                if (error) {
                    console.error('Error fetching comments from Supabase:', error);
                    // Fall back to sample comments
                    renderSampleComments(postId);
                } else if (data && data.length > 0) {
                    console.log(`Found ${data.length} comments for post ${postId}`);
                    renderComments(postId, data);
                } else {
                    console.log(`No comments found for post ${postId}`);
                    renderComments(postId, []);
                }
            } catch (error) {
                console.error('Error with Supabase comments query:', error);
                renderSampleComments(postId);
            }
        } else {
            // No Supabase connection, use sample comments
            renderSampleComments(postId);
        }
    } catch (error) {
        console.error(`Error loading comments for post ${postId}:`, error);
        renderSampleComments(postId);
    }
}

// Helper function to render sample comments
function renderSampleComments(postId) {
    const sampleComments = [
        {
            id: 1,
            post_id: postId,
            user_id: "team@voterdatahouse.com",
            content: "I'll take a look at this right away.",
            created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
            id: 2,
            post_id: postId,
            user_id: "admin@voterdatahouse.com",
            content: "Thanks, please update when resolved.",
            created_at: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
        }
    ];
    
    renderComments(postId, sampleComments);
}

// Function to render comments for a post
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

// Updated function to add a comment to a post
async function addComment(postId) {
    const inputElement = document.querySelector(`#post-${postId} .input-group input`);
    if (!inputElement) return;
    
    const content = inputElement.value.trim();
    if (!content) {
        showToast('Warning', 'Please enter a comment');
        return;
    }
    
    // Get current user info if available
    let userId = 'current.user@voterdatahouse.com';
    try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient.auth) {
            const { data } = await supabaseClient.auth.getUser();
            if (data && data.user) {
                userId = data.user.email || data.user.id || userId;
            }
        }
    } catch (error) {
        console.error('Error getting user:', error);
    }
    
    // Create a new comment object
    const newComment = {
        id: Math.floor(Math.random() * 1000) + 10,
        post_id: postId,
        user_id: userId,
        content: content,
        created_at: new Date().toISOString()
    };
    
    // Update UI immediately
    addCommentToUI(postId, newComment);
    
    // Clear the input field
    inputElement.value = '';
    
    // Show success toast
    showToast('Success', 'Comment added successfully');
    
    // Try to save to Supabase in the background
    if (typeof supabaseClient !== 'undefined') {
        try {
            console.log(`Saving comment to post ${postId} in Supabase`);
            
            const { data, error } = await supabaseClient
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: userId,
                    content: content,
                    created_at: new Date().toISOString()
                });
                
            if (error) {
                console.error('Error saving comment to Supabase:', error);
            } else {
                console.log('Comment saved to Supabase:', data);
            }
        } catch (error) {
            console.error('Error with Supabase comment insert:', error);
        }
    }
}

// Helper function to add a comment to the UI
function addCommentToUI(postId, comment) {
    const commentsContainer = document.querySelector(`#post-${postId} .comments-list`);
    if (!commentsContainer) return;
    
    // Remove "No comments yet" message if it exists
    const noCommentsMsg = commentsContainer.querySelector('.text-muted');
    if (noCommentsMsg) {
        commentsContainer.innerHTML = '';
    }
    
    // Create a new comment element
    const commentEl = document.createElement('div');
    commentEl.className = 'comment d-flex mb-2';
    commentEl.innerHTML = `
        <div class="user-avatar bg-light text-dark me-2" style="width: 28px; height: 28px; font-size: 12px;">
            ${getInitials(comment.user_id)}
        </div>
        <div>
            <div class="fw-bold small">${comment.user_id}</div>
            <div class="small">${comment.content}</div>
            <div class="text-muted x-small">Just now</div>
        </div>
    `;
    
    // Add to comments container
    commentsContainer.appendChild(commentEl);
}
