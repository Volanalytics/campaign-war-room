// Supabase client setup
const SUPABASE_URL = 'https://YOUR_SUPABASE_URL.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_PUBLIC_ANON_KEY';

// Initialize the Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
