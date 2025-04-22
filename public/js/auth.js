// auth.js - Authentication handling for Campaign Action Hub
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth system initializing...');
    
    // Set up password strength meter
    setupPasswordStrength();
    
    // Set up login form handler
    setupLoginForm();
    
    // Set up signup form handler
    setupSignupForm();
    
    // Set up logout button handler
    setupLogoutButton();
    
    // Check authentication status
    checkAuth();
    
    // Set up user management functionality for admins
    setupUserManagement();
});

// Function to set up password strength meter
function setupPasswordStrength() {
    const passwordInput = document.getElementById('signupPassword');
    const passwordStrength = document.getElementById('passwordStrength');
    const passwordFeedback = document.getElementById('passwordFeedback');
    
    if (passwordInput && passwordStrength && passwordFeedback) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = getPasswordStrength(password);
            
            passwordStrength.className = 'password-strength';
            
            if (password.length === 0) {
                passwordStrength.style.width = '0';
                passwordFeedback.textContent = 'Password must be at least 8 characters long';
            } else if (strength === 'weak') {
                passwordStrength.classList.add('weak');
                passwordFeedback.textContent = 'Weak: Add numbers and special characters';
            } else if (strength === 'medium') {
                passwordStrength.classList.add('medium');
                passwordFeedback.textContent = 'Medium: Try adding special characters';
            } else {
                passwordStrength.classList.add('strong');
                passwordFeedback.textContent = 'Strong password';
            }
        });
    }
}

// Function to set up login form handler
function setupLoginForm() {
    const loginButton = document.getElementById('loginButton');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    if (loginButton && loginForm) {
        loginButton.addEventListener('click', async function() {
            // Hide any previous errors
            if (loginError) {
                loginError.classList.add('d-none');
            }
            
            // Get form values
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Basic validation
            if (!email || !password) {
                if (loginError) {
                    loginError.textContent = 'Please enter your email and password';
                    loginError.classList.remove('d-none');
                }
                return;
            }
            
            // Disable button during login
            loginButton.disabled = true;
            loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
            
            try {
                // Attempt to sign in
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) {
                    throw error;
                }
                
                console.log('User logged in successfully:', data.user);
                
                // Close modal
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                if (loginModal) {
                    loginModal.hide();
                }
                
                // Update UI for logged in state
                updateAuthUI(true);
                
                // Check if user is approved
                await checkUserApproval(data.user.id);
                
                // Show success toast
                showToast('Success', 'Logged in successfully');
                
                // Refresh posts to show authenticated content
                if (typeof fetchPosts === 'function') {
                    fetchPosts();
                }
            } catch (error) {
                console.error('Login error:', error);
                
                if (loginError) {
                    loginError.textContent = error.message || 'Invalid email or password. Please try again.';
                    loginError.classList.remove('d-none');
                }
                
                // Reset button
                loginButton.disabled = false;
                loginButton.innerHTML = 'Log In';
            }
        });
    }
}

// Function to set up signup form handler
function setupSignupForm() {
    const signupButton = document.getElementById('signupButton');
    const signupForm = document.getElementById('signupForm');
    const signupError = document.getElementById('signupError');
    
    if (signupButton && signupForm) {
        signupButton.addEventListener('click', async function() {
            // Hide any previous errors
            if (signupError) {
                signupError.classList.add('d-none');
            }
            
            // Get form values
            const fullName = document.getElementById('signupFullName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
            
            // Basic validation
            if (!fullName || !email || !password || !passwordConfirm) {
                if (signupError) {
                    signupError.textContent = 'Please fill in all fields';
                    signupError.classList.remove('d-none');
                }
                return;
            }
            
            if (password !== passwordConfirm) {
                if (signupError) {
                    signupError.textContent = 'Passwords do not match';
                    signupError.classList.remove('d-none');
                }
                return;
            }
            
            if (getPasswordStrength(password) === 'weak') {
                if (signupError) {
                    signupError.textContent = 'Please choose a stronger password';
                    signupError.classList.remove('d-none');
                }
                return;
            }
            
            // Disable button during signup
            signupButton.disabled = true;
            signupButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating account...';
            
            try {
                // Attempt to sign up
                const { data, error } = await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                });
                
                if (error) {
                    throw error;
                }
                
                console.log('User signed up successfully:', data.user);
                
                // Create profile entry
                if (data.user) {
                    try {
                        const { error: profileError } = await supabaseClient
                            .from('profiles')
                            .insert([
                                { 
                                    id: data.user.id,
                                    full_name: fullName,
                                    email: email,
                                    role: 'user',
                                    approved: false // Requires admin approval
                                }
                            ]);
                        
                        if (profileError) {
                            console.error('Profile creation error:', profileError);
                            // Continue anyway since the auth account was created
                        }
                    } catch (profileError) {
                        console.error('Profile creation error:', profileError);
                        // Continue anyway since the auth account was created
                    }
                }
                
                // Close signup modal
                const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
                if (signupModal) {
                    signupModal.hide();
                }
                
                // Show success message
                showToast('Success', 'Account created successfully! Please check your email to verify your account.');
                
                // Reset button
                signupButton.disabled = false;
                signupButton.innerHTML = 'Create Account';
                
                // Open login modal
                setTimeout(() => {
                    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                    loginModal.show();
                }, 1000);
            } catch (error) {
                console.error('Signup error:', error);
                
                if (signupError) {
                    signupError.textContent = error.message || 'Error creating account. Please try again.';
                    signupError.classList.remove('d-none');
                }
                
                // Reset button
                signupButton.disabled = false;
                signupButton.innerHTML = 'Create Account';
            }
        });
    }
}

// Function to set up logout button handler
function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', async function() {
            try {
                await supabaseClient.auth.signOut();
                
                // Update UI for logged out state
                updateAuthUI(false);
                
                // Show success toast
                showToast('Success', 'Logged out successfully');
            } catch (error) {
                console.error('Logout error:', error);
                showToast('Error', 'Error logging out. Please try again.');
            }
        });
    }
}

// Function to check authentication status
async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            // User is logged in
            console.log('User is authenticated:', session.user);
            
            // Update UI for logged in state
            updateAuthUI(true);
            
            // Update user info
            updateUserInfo(session.user);
            
            // Check if user is approved
            await checkUserApproval(session.user.id);
        } else {
            // User is not logged in
            console.log('User is not authenticated');
            
            // Update UI for logged out state
            updateAuthUI(false);
        }
    } catch (error) {
        console.error('Auth check error:', error);
        
        // Assume not authenticated on error
        updateAuthUI(false);
    }
}

// Function to check if user is approved
async function checkUserApproval(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('approved, role')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('Error checking approval status:', error);
            
            // TEMPORARY FIX: Force enable admin features if the user is you
            if (userId === '184c484b-5b67-4fcb-acf5-3bc3309a578b') {
                console.log('Forcing admin mode for known admin user');
                updateUserRole('admin');
                enableAdminFeatures();
            }
            return;
        }
        
        console.log('User profile:', data);
        
        if (data) {
            // Update user role display
            updateUserRole(data.role);
            
            // Check if user is an admin
            if (data.role === 'admin') {
                enableAdminFeatures();
            }
            
            // Check if user is approved
            if (!data.approved) {
                // User is not approved
                showToast('Warning', 'Your account is pending approval by an administrator.');
            }
        }
    } catch (error) {
        console.error('Approval check error:', error);
    }
}

// Function to update auth UI based on auth state
function updateAuthUI(isAuthenticated) {
    const loggedInMenu = document.getElementById('loggedInMenu');
    const loggedOutMenu = document.getElementById('loggedOutMenu');
    const protectedContent = document.getElementById('protectedContent');
    const authOverlay = document.getElementById('authOverlay');
    
    if (isAuthenticated) {
        // Show logged in menu
        if (loggedInMenu) loggedInMenu.classList.remove('d-none');
        if (loggedOutMenu) loggedOutMenu.classList.add('d-none');
        
        // Show protected content
        if (protectedContent) protectedContent.classList.remove('content-protected');
        if (authOverlay) authOverlay.classList.add('d-none');
    } else {
        // Show logged out menu
        if (loggedInMenu) loggedInMenu.classList.add('d-none');
        if (loggedOutMenu) loggedOutMenu.classList.remove('d-none');
        
        // Hide protected content
        if (protectedContent) protectedContent.classList.add('content-protected');
        if (authOverlay) authOverlay.classList.remove('d-none');
    }
}

// Function to update user info in UI
function updateUserInfo(user) {
    const userDisplayName = document.getElementById('userDisplayName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (user) {
        // Set user display name (use email if name not available)
        if (userDisplayName) {
            if (user.user_metadata && user.user_metadata.full_name) {
                userDisplayName.textContent = user.user_metadata.full_name.split(' ')[0];
            } else {
                userDisplayName.textContent = user.email.split('@')[0];
            }
        }
        
        // Set user avatar initials
        if (userAvatar) {
            userAvatar.textContent = getInitialsFromUser(user);
        }
        
        // Set sender field in new post form to user's email
        const postSender = document.getElementById('postSender');
        if (postSender) {
            postSender.value = user.email;
        }
    }
}

// Function to update user role display
function updateUserRole(role) {
    const userRole = document.getElementById('userRole');
    
    if (userRole && role) {
        // Capitalize first letter of role
        const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);
        userRole.textContent = `Role: ${formattedRole}`;
    }
}

// Function to enable admin features
function enableAdminFeatures() {
    // Show admin-only menu items
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        element.classList.remove('d-none');
    });
    
    // Set up user management functionality
    loadPendingUsers();
    loadActiveUsers();
}

// Function to get initials from user object
function getInitialsFromUser(user) {
    if (user.user_metadata && user.user_metadata.full_name) {
        const nameParts = user.user_metadata.full_name.split(' ');
        if (nameParts.length > 1) {
            return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else {
            return nameParts[0].substring(0, 2).toUpperCase();
        }
    } else {
        // Fall back to email
        const email = user.email;
        const name = email.split('@')[0];
        if (name.includes('.')) {
            const parts = name.split('.');
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
}

// Function to evaluate password strength
function getPasswordStrength(password) {
    if (password.length < 8) {
        return 'weak';
    }
    
    // Check for numbers
    const hasNumber = /\d/.test(password);
    
    // Check for special characters
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // Check for uppercase letters
    const hasUppercase = /[A-Z]/.test(password);
    
    // Count the strength factors
    let score = 0;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    if (hasUppercase) score++;
    
    if (score === 0) {
        return 'weak';
    } else if (score < 3) {
        return 'medium';
    } else {
        return 'strong';
    }
}

// Function to show toast notification
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

// Function to set up user management functionality
function setupUserManagement() {
    // Set up tabs event handlers
    const pendingTab = document.getElementById('pending-tab');
    const activeTab = document.getElementById('active-tab');
    
    if (pendingTab) {
        pendingTab.addEventListener('click', loadPendingUsers);
    }
    
    if (activeTab) {
        activeTab.addEventListener('click', loadActiveUsers);
    }
}

// Function to load pending users
async function loadPendingUsers() {
    const pendingUsersTable = document.getElementById('pendingUsersTable');
    
    if (!pendingUsersTable) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('approved', false)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        if (data && data.length > 0) {
            let html = '';
            
            data.forEach(user => {
                const createdDate = new Date(user.created_at).toLocaleDateString();
                
                html += `
                    <tr>
                        <td>${user.full_name || 'Unknown'}</td>
                        <td>${user.email || 'No email'}</td>
                        <td>${createdDate}</td>
                        <td>
                            <button class="btn btn-sm btn-success" onclick="approveUser('${user.id}')">
                                <i class="bi bi-check-lg"></i> Approve
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="rejectUser('${user.id}')">
                                <i class="bi bi-x-lg"></i> Reject
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            pendingUsersTable.innerHTML = html;
        } else {
            pendingUsersTable.innerHTML = '<tr><td colspan="4" class="text-center">No pending users</td></tr>';
        }
    } catch (error) {
        console.error('Error loading pending users:', error);
        pendingUsersTable.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">
                    Error loading users: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Function to load active users
async function loadActiveUsers() {
    const activeUsersTable = document.getElementById('activeUsersTable');
    
    if (!activeUsersTable) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('approved', true)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        if (data && data.length > 0) {
            let html = '';
            
            data.forEach(user => {
                // Capitalize first letter of role
                const role = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';
                
                html += `
                    <tr>
                        <td>${user.full_name || 'Unknown'}</td>
                        <td>${user.email || 'No email'}</td>
                        <td>${role}</td>
                        <td>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    Actions
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="changeUserRole('${user.id}', 'admin')">Make Admin</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="changeUserRole('${user.id}', 'user')">Make User</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger" href="#" onclick="deactivateUser('${user.id}')">Deactivate</a></li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            activeUsersTable.innerHTML = html;
        } else {
            activeUsersTable.innerHTML = '<tr><td colspan="4" class="text-center">No active users</td></tr>';
        }
    } catch (error) {
        console.error('Error loading active users:', error);
        activeUsersTable.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">
                    Error loading users: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Function to approve a user
async function approveUser(userId) {
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ approved: true })
            .eq('id', userId);
        
        if (error) {
            throw error;
        }
        
        // Reload pending users
        loadPendingUsers();
        
        // Show success message
        showToast('Success', 'User approved successfully');
    } catch (error) {
        console.error('Error approving user:', error);
        showToast('Error', `Error approving user: ${error.message}`);
    }
}

// Function to reject/delete a user
async function rejectUser(userId) {
    if (!confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Delete profile first (due to foreign key constraints)
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .delete()
            .eq('id', userId);
        
        if (profileError) {
            throw profileError;
        }
        
        // Reload pending users
        loadPendingUsers();
        
        // Show success message
        showToast('Success', 'User rejected successfully');
    } catch (error) {
        console.error('Error rejecting user:', error);
        showToast('Error', `Error rejecting user: ${error.message}`);
    }
}

// Function to change a user's role
async function changeUserRole(userId, newRole) {
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);
        
        if (error) {
            throw error;
        }
        
        // Reload active users
        loadActiveUsers();
        
        // Show success message
        showToast('Success', `User role changed to ${newRole}`);
    } catch (error) {
        console.error('Error changing user role:', error);
        showToast('Error', `Error changing user role: ${error.message}`);
    }
}

// Function to deactivate a user
async function deactivateUser(userId) {
    if (!confirm('Are you sure you want to deactivate this user? They will no longer have access to the system.')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ approved: false })
            .eq('id', userId);
        
        if (error) {
            throw error;
        }
        
        // Reload active users
        loadActiveUsers();
        
        // Show success message
        showToast('Success', 'User deactivated successfully');
    } catch (error) {
        console.error('Error deactivating user:', error);
        showToast('Error', `Error deactivating user: ${error.message}`);
    }
}

// Make user management functions available globally
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.changeUserRole = changeUserRole;
window.deactivateUser = deactivateUser;
