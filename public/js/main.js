// Main JavaScript file

// Sample campaign data for Wilson County, TN
const campaignPosts = [
    {
        id: 1,
        title: "Urgent: Volunteer Needed for Saturday Canvassing",
        content: "We need 3 additional volunteers for this Saturday's canvassing effort in the Mt. Juliet area. Our team will be meeting at the campaign office at 9:00 AM and will finish around 12:30 PM.\n\nThis is a critical area for our campaign, and we need to make personal connections with these voters before the upcoming debate. If you can help, please respond ASAP!",
        sender: "volunteer@voterdatahouse.com",
        recipient: "info@voterdatahouse.com",
        category: "Urgent",
        created_at: "2025-04-19T08:15:00",
        action_type: "volunteer_request",
        status: "new",
        comments: [
            {
                id: 101,
                post_id: 1,
                user_id: "mike@voterdatahouse.com",
                content: "I can help with this. Will add it to my calendar now.",
                created_at: "2025-04-19T09:20:00"
            },
            {
                id: 102,
                post_id: 1,
                user_id: "jessica@voterdatahouse.com",
                content: "Great! We'll need one more volunteer. Also, remember to bring the updated talking points.",
                created_at: "2025-04-19T09:35:00"
            }
        ]
    },
    {
        id: 2,
        title: "Help share our new policy announcement on education",
        content: "Our candidate just announced their comprehensive education plan for Wilson County schools at today's Lebanon Rotary Club meeting. We need to amplify this on social media.\n\nHere's the announcement text to share:\n\n'Excited to announce our comprehensive plan for Wilson County schools! Focusing on teacher retention, expanded vocational training, and modernizing facilities without raising property taxes. Learn more at our website. #WilsonCountySchools #BetterEducation'",
        sender: "social@voterdatahouse.com",
        recipient: "info@voterdatahouse.com",
        category: "Social Media",
        created_at: "2025-04-18T13:45:00",
        action_type: "social_share",
        status: "new",
        comments: []
    },
    {
        id: 3,
        title: "Response Needed: Debate Question Preparation",
        content: "The Wilson County Chamber of Commerce has submitted their questions for next week's debate. We need someone to draft responses to these three priority questions:\n\n1. What specific infrastructure improvements would you prioritize in Wilson County?\n2. How will you address the growing concerns about water access in rural areas?\n3. What is your position on the proposed commercial development near the fairgrounds?",
        sender: "campaign@voterdatahouse.com",
        recipient: "info@voterdatahouse.com",
        category: "Email Action",
        created_at: "2025-04-17T11:30:00",
        action_type: "email_response",
        status: "completed",
        comments: [
            {
                id: 103,
                post_id: 3,
                user_id: "policy@voterdatahouse.com",
                content: "I've prepared draft responses for questions 1 and 3. Working on question 2 now - will need some input from our environmental policy advisor.",
                created_at: "2025-04-17T14:45:00"
            }
        ]
    }
];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Campaign Action Hub initialized');
    
    // Update email at the bottom of sidebar
    const emailElement = document.querySelector('.text-muted.small.mt-1');
    if (emailElement) {
        emailElement.innerHTML = '<i class="bi bi-envelope"></i> info@voterdatahouse.com';
    }
    
    // For initial testing, use the sample campaign data
    // Later, this will be replaced with Supabase data
    setTimeout(() => {
        renderPosts(campaignPosts);
    }, 1000); // Simulating loading delay
    
    // Setup event listeners
    setupEventListeners();
    
    // Add event listener for the submit new post button
    const submitNewPostBtn = document.getElementById('submitNewPost');
    if (submitNewPostBtn) {
        submitNewPostBtn.addEventListener('click', createNewPost);
    }
});

// Function to load posts from Supabase
async function loadPosts() {
  try {
    // Show loading indicator
    document.getElementById('post-loading').style.display = 'block';
    document.getElementById('posts-container').innerHTML = '';
    
    console.log('Fetching posts from Supabase...');
    
    // Fetch posts from Supabase
    if (supabaseClient) { // Make sure to use the same variable name as in your supabase-client.js
      const { data: posts, error } = await supabaseClient
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
      
      console.log('Posts retrieved from Supabase:', posts);
      
      // Render the posts
      renderPosts(posts);
    } else {
      // If Supabase client isn't available, use sample data
      console.warn('Supabase client not available, using sample data');
      renderPosts(campaignPosts);
    }
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

// Function to create a new post
async function createNewPost() {
  // Get form values
  const title = document.getElementById('postTitle').value;
  const category = document.getElementById('postCategory').value;
  const actionType = document.getElementById('postActionType').value;
  const content = document.getElementById('postContent').value;
  const sender = document.getElementById('postSender').value;
  const recipient = document.getElementById('postRecipient').value;
  
  // Validate form
  if (!title || !category || !actionType || !content || !sender || !recipient) {
    alert('Please fill out all required fields');
    return;
  }
  
  // Create new post object
  const newPost = {
    title: title,
    content: content,
    sender: sender,
    recipient: recipient,
    category: category,
    action_type: actionType,
    status: 'new',
    created_at: new Date().toISOString()
  };
  
  console.log('Attempting to save post to Supabase:', newPost);
  
  try {
    // Save to Supabase
    if (supabaseClient) {
      console.log('Supabase client found, sending data...');
      const { data, error } = await supabaseClient.from('posts').insert([newPost]);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Post saved successfully:', data);
      
      // Close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('newPostModal'));
      modal.hide();
      
      // Clear the form
      document.getElementById('newPostForm').reset();
      
      // Reload posts
      loadPosts();
      
      // Show success message
      alert('New action item created successfully!');
    } else {
      // If Supabase client isn't available, just use sample data
      console.warn('Supabase client not found, using sample data instead');
      campaignPosts.unshift({...newPost, id: Date.now(), comments: []});
      renderPosts(campaignPosts);
      
      // Close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('newPostModal'));
      modal.hide();
      
      // Clear the form
      document.getElementById('newPostForm').reset();
      
      // Show success message
      alert('New action item created successfully (sample data mode)');
    }
  } catch (error) {
    console.error('Error saving post:', error);
    alert('Failed to save to database. Check console for details.');
  }
}

// Function to generate action widgets based on post type
function generateActionWidget(post) {
    let widgetHTML = '<div class="action-widget">';
    
    switch(post.action_type) {
        case 'volunteer_request':
            widgetHTML += `
                <h5>Volunteer Request Actions</h5>
                <div class="mb-3">
                    <label class="form-label">Response Status</label>
                    <select class="form-select">
                        <option value="seeking_volunteers" selected>Seeking Volunteers</option>
                        <option value="partially_filled">Partially Filled</option>
                        <option value="fully_staffed">Fully Staffed</option>
                    </select>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" onclick="markAsComplete(${post.id})">Mark as Complete</button>
                    <button class="btn btn-outline-secondary" onclick="assignToTeam(${post.id})">Forward to Team</button>
                </div>
            `;
            break;
            
      case 'social_share':
    // Safely extract share text, defaulting to full content if third paragraph doesn't exist
    const contentParts = post.content.split('\n\n');
    const textToShare = contentParts.length >= 3 ? contentParts[2] : post.content;
    const shareText = encodeURIComponent(textToShare.replace(/'/g, ''));
    
    widgetHTML += `
        <h5>Social Media Actions</h5>
        <div class="mb-3">
            <p>Share this announcement on your social platforms:</p>
            <div class="p-2 border rounded bg-light">
                ${textToShare.replace(/'/g, '')}
            </div>
        </div>
        <div class="d-flex gap-2">
            <a href="https://twitter.com/intent/tweet?text=${shareText}" target="_blank" class="btn btn-primary">
                <i class="bi bi-twitter"></i> Share on Twitter
            </a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://campaign.voterdatahouse.com&summary=${shareText}" target="_blank" class="btn btn-outline-primary">
                <i class="bi bi-linkedin"></i> Share on LinkedIn
            </a>
            <button class="btn btn-outline-secondary" onclick="markAsComplete(${post.id})">Mark as Shared</button>
        </div>
    `;
    break;
            
        case 'email_response':
            widgetHTML += `
                <h5>Campaign Response Actions</h5>
                <div class="mb-3">
                    <label class="form-label">Draft Response</label>
                    <textarea class="form-control" rows="4" placeholder="Type your response to these debate questions..."></textarea>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" onclick="sendEmailResponse(${post.id})">
                        <i class="bi bi-envelope"></i> Submit Response
                    </button>
                    <button class="btn btn-outline-secondary" onclick="assignToTeam(${post.id})">
                        <i class="bi bi-people"></i> Assign to Policy Team
                    </button>
                </div>
            `;
            break;
            
        case 'event_coordination':
            widgetHTML += `
                <h5>Event Coordination Actions</h5>
                <div class="mb-3">
                    <label class="form-label">Event Status</label>
                    <select class="form-select">
                        <option value="planning" selected>Planning</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" onclick="markAsComplete(${post.id})">Update Status</button>
                    <button class="btn btn-outline-secondary" onclick="assignToTeam(${post.id})">Assign to Team</button>
                </div>
            `;
            break;
            
        default:
            widgetHTML += `
                <h5>Campaign Actions</h5>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" onclick="markAsComplete(${post.id})">Take Action</button>
                    <button class="btn btn-outline-secondary" onclick="assignToTeam(${post.id})">Assign to Team</button>
                </div>
            `;
    }
    
    widgetHTML += '</div>';
    return widgetHTML;
}

// Function to add a new comment
async function addComment(postId, button) {
  // Get the comment text
  const commentSection = button.closest('.add-comment');
  const commentInput = commentSection.querySelector('.comment-input');
  const commentText = commentInput.value.trim();
  
  if (!commentText) {
    alert('Please enter a comment');
    return;
  }
  
  // Create comment object
  const newComment = {
    post_id: postId,
    user_id: 'user@voterdatahouse.com', // This will be replaced with the actual user ID after authentication
    content: commentText,
    created_at: new Date().toISOString()
  };
  
  try {
    console.log('Attempting to save comment to Supabase:', newComment);
    
    // Save to Supabase
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('comments')
        .insert([newComment]);
        
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Comment saved successfully:', data);
      
      // Reload the comments for this post
      loadCommentsForPost(postId, button);
      
      // Clear the input
      commentInput.value = '';
    } else {
      // Add to sample data if Supabase not available
      console.warn('Supabase client not available, using sample data');
      // Find the post in sample data
      const post = campaignPosts.find(p => p.id === postId);
      if (post) {
        if (!post.comments) post.comments = [];
        post.comments.push({...newComment, id: Date.now()});
        
        // Update the comments section
        const commentsSection = button.closest('.comments-section');
        const commentsList = commentsSection.querySelector('.comments-list');
        commentsList.innerHTML = renderComments(post.comments);
      }
      
      // Clear the input
      commentInput.value = '';
    }
  } catch (error) {
    console.error('Error saving comment:', error);
    alert('Failed to save comment. Please try again.');
  }
}

// Function to load comments for a specific post
async function loadCommentsForPost(postId, element) {
  try {
    if (supabaseClient) {
      console.log(`Loading comments for post ${postId}...`);
      
      const { data: comments, error } = await supabaseClient
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error loading comments:', error);
        throw error;
      }
      
      console.log(`Comments loaded:`, comments);
      
      // Find the comments section and update it
      const commentsSection = element.closest('.comments-section');
      const commentsList = commentsSection.querySelector('.comments-list');
      commentsList.innerHTML = renderComments(comments);
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

// Function to render comments for a post
function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<div class="text-muted small">No comments yet</div>';
    }
    
    let html = '';
    comments.forEach(comment => {
        const commentDate = formatDate(comment.created_at);
        
        html += `
            <div class="comment mb-3">
                <div class="d-flex">
                    <div class="user-avatar bg-secondary me-2" style="width: 32px; height: 32px; font-size: 0.8em;">
                        ${getInitials(comment.user_id)}
                    </div>
                    <div>
                        <div class="fw-bold">${comment.user_id}</div>
                        <div>${comment.content}</div>
                        <div class="text-muted small">${commentDate}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    return html;
}

// Function to add a new comment
function addComment(postId, button) {
    // Get the comment text
    const commentSection = button.closest('.add-comment');
    const commentInput = commentSection.querySelector('.comment-input');
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
        alert('Please enter a comment');
        return;
    }
    
    // Create comment object
    const newComment = {
        id: Date.now(), // Simple unique ID
        post_id: postId,
        user_id: 'user@voterdatahouse.com', // In a real app, this would be the logged-in user
        content: commentText,
        created_at: new Date().toISOString()
    };
    
    // In a real app, you would save this to Supabase
    // For now, we'll just add it to our sample data
    const post = campaignPosts.find(p => p.id === postId);
    if (post) {
        if (!post.comments) {
            post.comments = [];
        }
        post.comments.push(newComment);
        
        // Update the comments section
        const commentsSection = button.closest('.comments-section');
        const commentsList = commentsSection.querySelector('.comments-list');
        commentsList.innerHTML = renderComments(post.comments);
        
        // Clear the input
        commentInput.value = '';
    }
}

// Function to mark a post as complete
async function markAsComplete(postId) {
    // For now, just show an alert
    alert(`Action item ${postId} marked as complete!`);
    // Later this will be: const success = await markPostAsComplete(postId);
    
    // Update the status in our local data
    const post = campaignPosts.find(p => p.id === postId);
    if (post) {
        post.status = 'completed';
        // Reload posts to reflect the change
        renderPosts(campaignPosts);
    }
}

// Function to filter posts by category
function filterPostsByCategory(category) {
    // Get all post cards
    const posts = document.querySelectorAll('.post-card');
    
    // If "All Actions" is selected, show all posts
    if (category.includes('All Actions')) {
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
                'Volunteer': 4,
                'Events': 5,
                'General': 6
            };
            
            return (priority[categoryA] || 999) - (priority[categoryB] || 999);
        });
    }
    
    // Re-append the sorted posts
    posts.forEach(post => postsContainer.appendChild(post));
}

// Function to assign to team (placeholder)
function assignToTeam(postId) {
    alert(`Action item ${postId} ready to be assigned. Team selection would open here.`);
    // In a real implementation, this would open a team selection dialog
}

// Function to send email response (placeholder)
function sendEmailResponse(postId) {
    const textarea = document.querySelector(`#posts-container .card:nth-child(${postId}) textarea`);
    const response = textarea ? textarea.value.trim() : '';
    if (response) {
        alert(`Email response submitted: ${response}`);
        // In a real implementation, this would send the email and update the database
    } else {
        alert('Please write a response first');
    }
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
        case 'Volunteer': return 'success';
        case 'Events': return 'primary';
        default: return 'secondary';
    }
}

// Function to render posts
function renderPosts(posts) {
    const postsContainer = document.getElementById('posts-container');
    document.getElementById('post-loading').style.display = 'none';
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<div class="alert alert-info">No posts yet. Create your first action item!</div>';
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
            <div class="card post-card" data-created-at="${post.created_at}">
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
                    
                    <div class="comments-section mb-3">
                        <hr>
                        <h6 class="mb-3"><i class="bi bi-chat-left-text"></i> Comments</h6>
                        
                        <div class="comments-list">
                            ${renderComments(post.comments || [])}
                        </div>
                        
                        <div class="add-comment mt-3">
                            <div class="d-flex">
                                <div class="user-avatar bg-primary me-2" style="width: 32px; height: 32px; font-size: 0.8em;">
                                    JD
                                </div>
                                <div class="flex-grow-1">
                                    <textarea class="form-control form-control-sm comment-input" placeholder="Add a comment..." rows="1"></textarea>
                                </div>
                            </div>
                            <div class="text-end mt-2">
                                <button class="btn btn-sm btn-primary add-comment-btn" onclick="addComment(${post.id}, this)">Comment</button>
                            </div>
                        </div>
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
    document.getElementById('all-count').textContent = categoryCounts['All'] || 0;
    
    // Update other category counts
    const categoryElements = document.querySelectorAll('#categories-list .sidebar-item');
    categoryElements.forEach(element => {
        const category = element.querySelector('span:first-child').textContent.trim();
        
        if (category.includes('Urgent')) {
            element.querySelector('.badge').textContent = categoryCounts['Urgent'] || 0;
        } else if (category.includes('Email Action')) {
            element.querySelector('.badge').textContent = categoryCounts['Email Action'] || 0;
        } else if (category.includes('Social Media')) {
            element.querySelector('.badge').textContent = categoryCounts['Social Media'] || 0;
        } else if (category.includes('Volunteer')) {
            element.querySelector('.badge').textContent = categoryCounts['Volunteer'] || 0;
        } else if (category.includes('Events')) {
            element.querySelector('.badge').textContent = categoryCounts['Events'] || 0;
        }
    });
}
