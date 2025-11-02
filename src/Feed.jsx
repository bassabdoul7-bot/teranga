import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { RiShareForwardLine } from 'react-icons/ri';
import { FaRegCommentAlt, FaTrash, FaImage, FaUserCircle, FaStore, FaPencilAlt, FaPlus } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import CommentSection from './CommentSection';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate

// --- START: Helper Functions ---
async function uploadMedia(file, userId) {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    // BUCKET CHANGED TO 'post_photos'
    const { data, error } = await supabase.storage.from('post_photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) { console.error('Storage Upload Error:', error); alert('Image upload failed: ' + error.message); return null; }
    const { data: publicURLData } = supabase.storage.from('post_photos').getPublicUrl(fileName);
    return publicURLData.publicUrl;
}
// --- END: Helper Functions ---

// --- NEW: StoryReel Component ---
function StoryReel({ stories, profiles, currentUserId }) {
    const navigate = useNavigate();
    const [profileMap, setProfileMap] = useState({});

    useEffect(() => {
        // Create a map for quick profile lookups
        const map = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
        }, {});
        setProfileMap(map);
    }, [profiles]);

    // --- STYLES CHANGED TO RECTANGLE ---
    const storyCardStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        width: '65px', // Card width
        textAlign: 'center',
        flexShrink: 0,
    };

    const storyImageContainer = {
        width: '65px',
        height: '90px', // Card height
        borderRadius: '8px', // Rounded corners
        padding: '3px',
        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
    };

    const storyImage = {
        width: '100%',
        height: '100%',
        borderRadius: '6px', // Inner rounded corners
        objectFit: 'cover',
        border: '2px solid #121a2a', // Match body background
        backgroundColor: '#4A4A4A',
        boxSizing: 'border-box',
    };
    
    const storyAddCard = {
        ...storyCardStyle,
        marginLeft: '10px',
    };

    const storyAddImageContainer = {
        ...storyImageContainer,
        background: '#4A4A4A',
    };

     const storyAddIcon = {
        ...storyImage,
        backgroundColor: '#3A3A3A',
        color: '#E0E0E0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
    };
    // --- END STYLE CHANGES ---

    const storyUsernameStyle = {
        fontSize: '0.75em',
        color: '#BDBDBD',
        marginTop: '4px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: '100%',
    };

    // Placeholder for Story Viewer
    const openStory = (story) => {
        navigate(`/stories/${story.user_id}`);
    };

    // Placeholder for Story Upload
    const addStory = () => {
        navigate('/stories/upload');
    };

    return (
        <div style={{ padding: '10px 0 15px 0', borderBottom: '1px solid #4A4A4A', marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingLeft: '15px' }}>
                {/* Add Story Button */}
                <div style={storyAddCard} onClick={addStory}>
                    <div style={storyAddImageContainer}>
                        <div style={storyAddIcon}>
                            <FaPlus />
                        </div>
                    </div>
                    <span style={storyUsernameStyle}>Add Story</span>
                </div>

                {/* Other users' stories */}
                {stories.map(story => {
                    const profile = profileMap[story.user_id];
                    if (!profile) return null;
                    return (
                        <div key={story.id} style={storyCardStyle} onClick={() => openStory(story)}>
                            <div style={storyImageContainer}>
                                <img src={profile.avatar_url} alt={profile.username} style={storyImage} />
                            </div>
                            <span style={storyUsernameStyle}>{profile.username}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
// --- END: StoryReel Component ---


// --- PostList Component (UPDATED with Edit Functionality) ---
function PostList({ posts, profiles, userLikes, onLikeToggle, currentUserId, onDataChange }) {
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  if (!posts || posts.length === 0) {
    return <p style={{ textAlign: 'center', color: '#A0AEC0', marginTop: '30px' }}>Be the first to post in the community!</p>;
  }

  // --- Share Functionality ---
  const handleShare = async (postContent, postId) => {
    const shareData = { title: 'Post from TerangaHub', text: postContent, url: window.location.origin + '/post/' + postId };
    try {
      if (navigator.share) { await navigator.share(shareData); console.log('Shared'); }
      else { navigator.clipboard.writeText(shareData.url); alert('Link copied!'); }
    } catch (err) { console.error('Share error:', err); }
  };

  // --- Delete Post Functionality ---
  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This will also delete all comments/likes.')) {
        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (error) { alert('Error deleting post: ' + error.message); }
        else { onDataChange(); }
    }
  };

  // --- NEW: Edit Post Handlers ---
  const handleEditClick = (post) => {
    setEditingPostId(post.id);
    setEditingContent(post.content);
  };

  const handleEditCancel = () => {
    setEditingPostId(null);
    setEditingContent('');
  };

  const handleEditSave = async (postId) => {
    setEditLoading(true);
    const { error } = await supabase
        .from('posts')
        .update({ content: editingContent, updated_at: new Date() })
        .eq('id', postId);
    
    setEditLoading(false);
    if (error) {
        alert('Error updating post: ' + error.message);
    } else {
        handleEditCancel();
        onDataChange(); // Refresh feed
    }
  };
  // --- END: Edit Post Handlers ---

  // Toggle comment section visibility
  const toggleComments = (postId) => {
    setExpandedPostId(currentId => (currentId === postId ? null : postId));
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {posts.map(post => {
        if (!post || !post.id || !post.user_id) return null;

        const authorProfile = profiles.find(p => p.id === post.user_id);
        const username = authorProfile ? authorProfile.username || authorProfile.full_name : 'Unknown User';
        const avatarUrl = authorProfile ? authorProfile.avatar_url : null;
        const hasLiked = Array.isArray(userLikes) && userLikes.some(like => like.post_id === post.id);
        const likeCount = post.like_count || 0;
        const commentCount = post.comment_count || 0;
        const isExpanded = expandedPostId === post.id;
        const isOwnPost = post.user_id === currentUserId;

        let postTimeAgo = '';
        try {
            // NEW: Check if post was edited
            const dateToFormat = post.updated_at ? new Date(post.updated_at) : new Date(post.created_at);
            postTimeAgo = formatDistanceToNow(dateToFormat, { addSuffix: true });
            postTimeAgo = postTimeAgo.replace('about ', '');
            if (post.updated_at) {
                postTimeAgo += ' (edited)';
            }
        } catch (e) {
            postTimeAgo = 'just now';
        }

        return (
          <div key={post.id} style={{ padding: '15px 0', marginBottom: '15px', borderBottom: '1px solid #4A5A6A' }}>
            {/* Post Author Info + Edit/Delete Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                {/* Avatar and User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link to={`/profile/${post.user_id}`}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <FaUserCircle style={{ fontSize: '40px', color: '#4A4A4A' }} />
                        )}
                    </Link>
                    <div>
                        <Link to={`/profile/${post.user_id}`} style={{ textDecoration: 'none' }}>
                            <p style={{ fontWeight: 'bold', margin: 0, fontSize: '1.0em', color: '#A6D1E6' }}>{username}</p>
                        </Link>
                        <p style={{ margin: 0, fontSize: '0.8em', color: '#757575' }}>{postTimeAgo}</p>
                    </div>
                </div>
                
                {/* NEW: Edit/Delete Button Group */}
                {isOwnPost && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                            onClick={() => handleEditClick(post)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#757575', fontSize: '0.9em', height: 'fit-content' }}
                            aria-label="Edit post"
                        >
                            <FaPencilAlt />
                        </button>
                        <button
                            onClick={() => handleDeletePost(post.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6B6B', fontSize: '0.9em', height: 'fit-content' }}
                            aria-label="Delete post"
                        >
                            <FaTrash />
                        </button>
                    </div>
                )}
            </div>

            {/* --- NEW: Conditional Edit/View for Post Content --- */}
            {editingPostId === post.id ? (
                <div style={{ marginTop: '10px' }}>
                    <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        style={{ width: '100%', minHeight: '80px', padding: '10px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #BDBDBD', resize: 'vertical', backgroundColor: '#FFFFFF', color: '#121212' }}
                        disabled={editLoading}
                    />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button onClick={() => handleEditSave(post.id)} className="btn btn-primary" disabled={editLoading}>
                            {editLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={handleEditCancel} className="btn btn-muted" disabled={editLoading}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <p style={{ margin: '0 0 10px 0', fontSize: '1.1em', wordWrap: 'break-word', color: '#E0E0E0' }}>{post.content}</p>
            )}
            {/* --- END OF CHANGE --- */}


            {/* Conditional rendering for video/image */}
            {post.image_url && (
                post.media_type === 'video'
                ? (
                    <video
                        src={post.image_url}
                        controls
                        style={{ width: '100%', height: 'auto', maxHeight: '300px', borderRadius: '8px', marginBottom: '15px' }}
                    >
                        Your browser does not support the video tag.
                    </video>
                )
                : (
                    <img
                        src={post.image_url}
                        alt="Post media"
                        style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }}
                    />
                )
            )}

            {/* --- Like, Comment, & Share Buttons --- */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '1px solid #1E1E1E', paddingTop: '10px', marginTop: '10px' }}>
              {/* Like Button & Count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <button
                  onClick={() => onLikeToggle(post.id, hasLiked)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', fontSize: '1.2em', color: hasLiked ? '#FF6B6B' : '#757575' }}
                  aria-label={hasLiked ? 'Unlike post' : 'Like post'}
                >
                  {hasLiked ? '❤️' : '🤍'}
                </button>
                <span style={{ color: '#E0E0E0', fontSize: '0.9em' }}>{likeCount}</span>
              </div>

              {/* Comment Button & Count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                 <button
                    onClick={() => toggleComments(post.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', fontSize: '1.1em', color: '#757575' }}
                    aria-label="Toggle comments"
                 >
                    <FaRegCommentAlt />
                 </button>
                 <span style={{ color: '#E0E0E0', fontSize: '0.9em' }}>{commentCount}</span>
              </div>

              {/* Share Button */}
              <button
                 onClick={() => handleShare(post.content, post.id)}
                 style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', fontSize: '1.2em', color: '#A6D1E6', marginLeft: 'auto' }}
                 aria-label="Share post"
              >
                 <RiShareForwardLine />
              </button>
            </div>

            {/* --- Conditionally Rendered Comment Section --- */}
            {isExpanded && <CommentSection postId={post.id} userId={currentUserId} onCommentChange={onDataChange} />}

          </div>
        );
      })}
    </div>
  );
}

// --- Updated CreatePost to handle video ---
function CreatePost({ userId, onPostCreated }) {
    const [content, setContent] = useState('');
    const [mediaFile, setMediaFile] = useState(null); // Renamed from imageFile
    const [loading, setLoading] = useState(false);
    
    const handleFileChange = (e) => { 
        if (e.target.files && e.target.files[0]) { 
            setMediaFile(e.target.files[0]); 
        } 
    };

    async function handleSubmit(event) {
        event.preventDefault(); 
        if (!content.trim() && !mediaFile) return; 
        
        setLoading(true); 
        let mediaUrl = null;
        let media_type = null;

        if (mediaFile) { 
            mediaUrl = await uploadMedia(mediaFile, userId); // Use renamed function
            if (!mediaUrl) { 
                setLoading(false); 
                return; 
            }
            // Determine if it's a video or image
            media_type = mediaFile.type.startsWith('video') ? 'video' : 'image';
        }

        const { error } = await supabase.from('posts').insert({ 
            user_id: userId, 
            content: content.trim(), 
            image_url: mediaUrl, // Still use image_url column for simplicity
            media_type: media_type // Save the new type
        });
        
        setLoading(false);
        if (error) { 
            alert('Error creating post: ' + error.message); 
        } else { 
            setContent(''); 
            setMediaFile(null); // Reset mediaFile state
            onPostCreated(); 
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
            <textarea
                placeholder="What's on your mind, Teranga?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="3"
                disabled={loading}
                style={{ width: '100%', padding: '12px', boxSizing: 'border-box', marginBottom: '10px', borderRadius: '6px', border: '1px solid #BDBDBD', resize: 'vertical', backgroundColor: '#FFFFFF', color: '#121212' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <label htmlFor="media-upload" style={{ cursor: 'pointer', color: '#A6D1E6' }}>
                    <FaImage style={{ fontSize: '1.5em', verticalAlign: 'middle' }} />
                    <span style={{ fontSize: '0.9em', marginLeft: '5px' }}>
                         {mediaFile ? `File: ${mediaFile.name}` : 'Add Photo/Video'}
                    </span>
                </label>
                <input 
                    id="media-upload" 
                    type="file" 
                    accept="image/png, image/jpeg, video/mp4, video/quicktime" 
                    onChange={handleFileChange} 
                    disabled={loading} 
                    style={{ display: 'none' }} 
                />
            </div>
            <button type="submit" disabled={loading || (!content.trim() && !mediaFile)} className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? 'Posting...' : 'Post to Community'}
            </button>
        </form>
    );
}

// --- Main Feed Component (UPDATED to fetch Stories) ---
export default function Feed({ session }) {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]); // NEW: State for stories
  const [profiles, setProfiles] = useState([]);
  const [userLikes, setUserLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshToggle, setRefreshToggle] = useState(0);

  async function fetchFeed() {
    setLoading(true);
    const currentUserId = session.user.id;

    // --- NEW: Fetch Stories ---
    // Fetch stories from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('id, user_id, media_url, media_type, created_at')
        .gt('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

    if (storiesError) { console.error('Err fetch stories:', storiesError); }
    setStories(storiesData || []);
    // --- END NEW ---

    // Fetch Posts
    const { data: postsData, error: postsError } = await supabase.from('posts').select('id, user_id, created_at, updated_at, content, image_url, media_type, likes ( count ), comments ( count )').order('created_at', { ascending: false });
    if (postsError) { console.error('Err fetch posts:', postsError); setLoading(false); return; }
    
    const postsWithCounts = (postsData || []).map(post => ({ ...post, like_count: post.likes && post.likes[0] ? post.likes[0].count : 0, comment_count: post.comments && post.comments[0] ? post.comments[0].count : 0 }));
    setPosts(postsWithCounts);
    
    // Get all unique user IDs from both stories and posts
    const postUserIds = postsWithCounts.map(post => post.user_id);
    const storyUserIds = (storiesData || []).map(story => story.user_id);
    const userIds = [...new Set([...postUserIds, ...storyUserIds, currentUserId])]; // Also add current user for 'Add Story'

    if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', userIds);
        if (profilesError) { console.error('Err fetch profiles:', profilesError); }
        setProfiles(profilesData || []);
    } else { setProfiles([]); }
     
    const { data: likesData, error: likesError } = await supabase.from('likes').select('post_id').eq('user_id', currentUserId);
     if (likesError) { console.error('Err fetch likes:', likesError); }
     setUserLikes(likesData || []);
    setLoading(false);
  }

  useEffect(() => { fetchFeed(); }, [session.user.id, refreshToggle]);
  const handleDataChange = () => { setRefreshToggle(prev => prev + 1); };
  const handleLikeToggle = async (postId, hasLiked) => {
    const currentUserId = session.user.id; if (hasLiked) { const { error } = await supabase.from('likes').delete().match({ user_id: currentUserId, post_id: postId }); if (error) { console.error('Err unlike:', error); } else { setUserLikes(prev => prev.filter(l => l.post_id !== postId)); setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: Math.max(0, p.like_count - 1) } : p )); } } else { const { error } = await supabase.from('likes').insert({ user_id: currentUserId, post_id: postId }); if (error) { console.error('Err like:', error); } else { setUserLikes(prev => [...prev, { post_id: postId }]); setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: p.like_count + 1 } : p )); } }
  };

  if (loading && posts.length === 0 && stories.length === 0) {
    return <div style={{ textAlign: 'center', marginTop: '50px', color: '#E0E0E0' }}>Loading Community Dashboard...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 15px' }}>
      <header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0', paddingBottom: '10px', borderBottom: '1px solid #4A4A4A' }}>
        <h1 style={{ color: '#E0E0E0', margin: 0, fontSize: '1.5em' }}>Community Dashboard</h1>
      </header>

      {/* --- This is the button you want to keep --- */}
      <div style={{ marginBottom: '20px' }}>
        <Link 
            to="/profile" 
            className="btn btn-secondary" 
            style={{ 
                textDecoration: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', // Centers the icon and text
                gap: '8px', 
                fontSize: '0.9em', 
                padding: '10px 16px', // Balanced padding
                width: 'fit-content', // Makes button only as wide as content
                margin: '0 auto' // Centers the button on the page
            }}
        >
            <FaStore />
            Add Listing
        </Link>
      </div>

      {/* --- NEW: Display the StoryReel --- */}
      <StoryReel stories={stories} profiles={profiles} currentUserId={session.user.id} />

      <CreatePost userId={session.user.id} onPostCreated={handleDataChange} />

      <h2 style={{ color: '#E0E0E0', margin: '30px 0 10px 0', borderBottom: '1px solid #4A4A4A', paddingBottom: '5px' }}>Community Feed</h2>

      <PostList
        posts={posts}
        profiles={profiles}
        userLikes={userLikes}
        onLikeToggle={handleLikeToggle}
        currentUserId={session.user.id}
        onDataChange={handleDataChange}
      />
    </div>
  );
}