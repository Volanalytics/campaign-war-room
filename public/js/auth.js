// Authentication functions for Campaign Action Hub

// Check if user is already logged in on page load
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication state
  checkAuthState();
  
  // Set up event listeners for auth forms
  setupAuthEventListeners();
});

// Set up event listeners for authentication forms
function setupAuthEventListeners() {
  // Login button
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.addEventListener('click', handleLogin);
  }
  
  // Signup button
  const signupButton = document.getElementById('signupButton');
  if (signupButton) {
    signupButton.addEventListener('click', handleSignup);
  }
  
  // Logout button
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
  
  // User management tab buttons
  const pendingTab = document.getElementById('pending-tab');
  if (pendingTab) {
    pendingTab.addEventListener('click', loadPendingUsers);
  }
  
  const activeTab = document.getElementById('active-tab');
  if (activeTab) {
    activeTab.addEventListener('click', loadActiveUsers);
  }

  // Add listeners to enter key in forms
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSignup();
      }
    });
  }
}

// Function to check authentication state
async function checkAuthState() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error) {
      console.error('Error checking auth state:', error);
      return;
    }
    
    if (session) {
      // User is logged in
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      // Check if user is approved
      if (user.user_metadata && user.user_metadata.approved) {
        console.log('User is logged in and approved:', user);
        updateAuthUI(user);
      } else {
        console.log('User is logged in but not approved');
        // Log them out if not approved
        await supabaseClient.auth.signOut();
        updateAuthUI(null);
        alert('Your account is pending approval by an administrator.');
      }
    } else {
      // User is not logged in
      console.log('User is not logged in');
      updateAuthUI(null);
    }
  } catch (error) {
    console.error('Error in checkAuthState:', error);
    updateAuthUI(null);
  }
}

// Function to sign up a new user
async function signUp(email, password, fullName) {
  try {
    // Register user with Supabase auth
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'pending', // Default role is pending until approved
          approved: false
        }
      }
    });
    
    if (error) throw error;
    
    // Also add to profiles table for easier querying
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert([
        { 
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: 'pending',
          approved: false
        }
      ]);
    
    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Continue anyway as the auth user was created
    }
    
    return data.user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

// Function to log in
async function logIn(email, password) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Check if user is approved
    if (data.user.user_metadata && !data.user.user_metadata.approved) {
      await supabaseClient.auth.signOut();
      throw new Error('Your account is pending approval. Please check back later.');
    }
    
    return data.user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

// Function to log out
async function logOut() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
}

// Function to get current user
async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Function for admins to approve users - simplified to avoid Edge Functions
async function approveUser(userId, role) {
  try {
    // Check if current user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.user_metadata || currentUser.user_metadata.role !== 'admin') {
      throw new Error('Only administrators can approve users.');
    }
    
    // Since we can't use Edge Functions or directly modify auth.users,
    // we'll just update the profiles table
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ 
        approved: true, 
        role: role 
      })
      .eq('id', userId);
    
    if (profileError) throw profileError;
    
    return true;
  } catch (error) {
    console.error('Error approving user:', error);
    throw error;
  }
}

// Function to reject a user - simplified to avoid Edge Functions
async function rejectUser(userId) {
  try {
    // Check if current user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.user_metadata || currentUser.user_metadata.role !== 'admin') {
      throw new Error('Only administrators can reject users.');
    }
    
    // Since we can't use Edge Functions or directly delete from auth,
    // we'll just delete from profiles table
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) throw profileError;
    
    return true;
  } catch (error) {
    console.error('Error rejecting user:', error);
    throw error;
  }
}

// Handle login form submission
async function handleLogin() {
  console.log('Login button clicked');
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorElement = document.getElementById('loginError');
  
  errorElement.classList.add('d-none');
  
  if (!email || !password) {
    errorElement.textContent = 'Please enter both email and password.';
    errorElement.classList.remove('d-none');
    return;
  }
  
  try {
    const user = await logIn(email, password);
    if (user) {
      // Close modal
      const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      if (loginModal) {
        loginModal.hide();
      }
      
      // Update UI for logged in state
      updateAuthUI(user);
      
      // Refresh content
      if (typeof loadPosts === 'function') {
        loadPosts();
      }
    }
  } catch (error) {
    errorElement.textContent = error.message || 'Login failed. Please try again.';
    errorElement.classList.remove('d-none');
  }
}

// Handle signup form submission
async function handleSignup() {
  console.log('Signup button clicked');
  
  const fullName = document.getElementById('signupFullName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
  const errorElement = document.getElementById('signupError');
  
  errorElement.classList.add('d-none');
  
  // Validate form
  if (!fullName || !email || !password || !passwordConfirm) {
    errorElement.textContent = 'Please fill out all fields.';
    errorElement.classList.remove('d-none');
    return;
  }
  
  if (password !== passwordConfirm) {
    errorElement.textContent = 'Passwords do not match.';
    errorElement.classList.remove('d-none');
    return;
  }
  
  if (password.length < 8) {
    errorElement.textContent = 'Password must be at least 8 characters long.';
    errorElement.classList.remove('d-none');
    return;
  }
  
  try {
    const user = await signUp(email, password, fullName);
    if (user) {
      // Close signup modal
      const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
      if (signupModal) {
        signupModal.hide();
      }
      
      // Show success message
      alert('Account created successfully! An administrator will approve your account soon.');
      
      // Switch to login modal
      const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
      loginModal.show();
    }
  } catch (error) {
    errorElement.textContent = error.message || 'Signup failed. Please try again.';
    errorElement.classList.remove('d-none');
  }
}

// Handle logout
async function handleLogout() {
  const success = await logOut();
  if (success) {
    updateAuthUI(null);
    if (typeof loadPosts === 'function') {
      loadPosts(); // Refresh content with public access
    }
  } else {
    alert('Error logging out. Please try again.');
  }
}

// Update UI based on authentication state
function updateAuthUI(user) {
  const loggedOutMenu = document.getElementById('loggedOutMenu');
  const loggedInMenu = document.getElementById('loggedInMenu');
  const userDisplayName = document.getElementById('userDisplayName');
  const userRole = document.getElementById('userRole');
  const adminOnlyElements = document.querySelectorAll('.admin-only');
  const userAvatar = document.querySelector('#loggedInMenu .user-avatar');
  
  if (user) {
    // User is logged in
    loggedOutMenu.classList.add('d-none');
    loggedInMenu.classList.remove('d-none');
    
    // Set user display name and initials
    const displayName = user.user_metadata?.full_name || user.email;
    userDisplayName.textContent = displayName;
    
    if (userAvatar) {
      userAvatar.textContent = getInitials(displayName);
    }
    
    // Set user role
    const role = user.user_metadata?.role || 'Member';
    userRole.textContent = `Role: ${role.charAt(0).toUpperCase() + role.slice(1)}`;
    
    // Show admin features if applicable
    if (role === 'admin') {
      adminOnlyElements.forEach(el => el.classList.remove('d-none'));
    } else {
      adminOnlyElements.forEach(el => el.classList.add('d-none'));
    }
  } else {
    // User is logged out
    loggedOutMenu.classList.remove('d-none');
    loggedInMenu.classList.add('d-none');
    adminOnlyElements.forEach(el => el.classList.add('d-none'));
  }
}

// Load pending users for admin panel - modified to handle permission issues
async function loadPendingUsers() {
  const tableBody = document.getElementById('pendingUsersTable');
  
  // Only proceed if user is admin
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Access denied. Admin privileges required.</td></tr>';
    return;
  }
  
  try {
    // Get pending users from profiles table only
    const { data: users, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('approved', false);
      
    if (error) throw error;
    
    if (users && users.length > 0) {
      let html = '';
      users.forEach(user => {
        const createdAt = user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown';
        html += `
          <tr>
            <td>${user.full_name || 'Unknown'}</td>
            <td>${user.email || 'Unknown'}</td>
            <td>${createdAt}</td>
            <td>
              <div class="btn-group" role="group">
                <button type="button" class="btn btn-sm btn-success" onclick="approveUserWithRole('${user.id}', 'member')">
                  <i class="bi bi-check-lg"></i> Approve
                </button>
                <button type="button" class="btn btn-sm btn-danger" onclick="rejectUserConfirm('${user.id}')">
                  <i class="bi bi-x-lg"></i> Reject
                </button>
              </div>
            </td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;
    } else {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No pending users found.</td></tr>';
    }
  } catch (error) {
    console.error('Error loading pending users:', error);
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading users: ${error.message}</td></tr>`;
  }
}

// Load active users for admin panel - modified to handle permission issues
async function loadActiveUsers() {
  const tableBody = document.getElementById('activeUsersTable');
  
  // Only proceed if user is admin
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.user_metadata?.role !== 'admin') {
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Access denied. Admin privileges required.</td></tr>';
    return;
  }
  
  try {
    // Get active users from profiles table only
    const { data: users, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('approved', true);
      
    if (error) throw error;
    
    if (users && users.length > 0) {
      let html = '';
      users.forEach(user => {
        html += `
          <tr>
            <td>${user.full_name || 'Unknown'}</td>
            <td>${user.email || 'Unknown'}</td>
            <td>${user.role || 'member'}</td>
            <td>
              <div class="btn-group" role="group">
                <button type="button" class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
                  Change Role
                </button>
                <ul class="dropdown-menu">
                  <li><a class="dropdown-item" href="#" onclick="changeUserRole('${user.id}', 'admin')">Admin</a></li>
                  <li><a class="dropdown-item" href="#" onclick="changeUserRole('${user.id}', 'editor')">Editor</a></li>
                  <li><a class="dropdown-item" href="#" onclick="changeUserRole('${user.id}', 'contributor')">Contributor</a></li>
                  <li><a class="dropdown-item" href="#" onclick="changeUserRole('${user.id}', 'volunteer')">Volunteer</a></li>
                </ul>
              </div>
            </td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;
    } else {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No active users found.</td></tr>';
    }
  } catch (error) {
    console.error('Error loading active users:', error);
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading users: ${error.message}</td></tr>`;
  }
}

// Helper function to approve user with specific role
async function approveUserWithRole(userId, role) {
  try {
    await approveUser(userId, role);
    alert(`User approved with role: ${role}`);
    loadPendingUsers(); // Refresh the list
  } catch (error) {
    alert(`Error approving user: ${error.message}`);
  }
}

// Helper function to confirm user rejection
async function rejectUserConfirm(userId) {
  if (confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
    try {
      await rejectUser(userId);
      alert('User rejected successfully');
      loadPendingUsers(); // Refresh the list
    } catch (error) {
      alert(`Error rejecting user: ${error.message}`);
    }
  }
}

// Function to change user role
async function changeUserRole(userId, newRole) {
  try {
    await approveUser(userId, newRole);
    alert(`User role changed to: ${newRole}`);
    loadActiveUsers(); // Refresh the list
  } catch (error) {
    alert(`Error changing user role: ${error.message}`);
  }
}

// Helper function to get initials from name
function getInitials(name) {
  if (!name) return '??';
  
  // If it's an email without a name
  if (name.includes('@')) {
    return name.substring(0, 2).toUpperCase();
  }
  
  // For a full name
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  // For a single name
  return name.substring(0, 2).toUpperCase();
}

// Make these functions global so they can be called from HTML
window.approveUserWithRole = approveUserWithRole;
window.rejectUserConfirm = rejectUserConfirm;
window.changeUserRole = changeUserRole;
