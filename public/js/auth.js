// Supabase Authentication Functions

// Function to sign up a new user
async function signUp(email, password, fullName) {
  try {
    // Register user with Supabase auth
    const { user, error } = await supabaseClient.auth.signUp({
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
    
    alert('Account created! An administrator will approve your account soon.');
    return user;
  } catch (error) {
    console.error('Error signing up:', error);
    alert('Error creating account: ' + error.message);
    return null;
  }
}

// Function to log in
async function logIn(email, password) {
  // Login function code...
}

// Function to log out
async function logOut() {
  // Logout function code...
}

// Function to check if user is logged in
async function checkAuthState() {
  // Auth state checking code...
}

// Function for admins to approve users
async function approveUser(userId, role) {
  // User approval code...
}

// Function to get current user info
async function getCurrentUser() {
  // Get user info code...
}
