// Supabase client setup
const SUPABASE_URL = 'https://xhqzjelmxblchcdcdigv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocXpqZWxteGJsY2hjZGNkaWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDIwNzAsImV4cCI6MjA2MDQxODA3MH0.9IaodsGAvJXHwndCCTms3JT2f5dBqNNIrxE0EqOhT7s';

// Initialize client using the globally available supabase object
let supabase = null;

try {
  // Try to initialize using the UMD global
  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase client initialized successfully');
  } else {
    console.error('Supabase client library not found in global scope');
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}
// Function to fetch posts from Supabase
async function fetchPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// Function to mark a post as complete
async function markPostAsComplete(postId) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ status: 'completed', updated_at: new Date() })
      .eq('id', postId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating post:', error);
    return false;
  }
}

// Function to add a new comment
async function addComment(postId, userId, content) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, user_id: userId, content }]);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding comment:', error);
    return false;
  }
}
