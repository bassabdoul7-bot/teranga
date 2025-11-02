import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { RiShareForwardLine } from 'react-icons/ri';
import { FaRegCommentAlt, FaTrash, FaImage, FaUserCircle, FaStore, FaPencilAlt, FaPlus, FaArrowLeft, FaVideo } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import CommentSection from './CommentSection';
import { Link, useNavigate } from 'react-router-dom';

// --- (Helper Function - No Change) ---
async function uploadMedia(file, userId) {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('post_photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) { console.error('Storage Upload Error:', error); alert('Image upload failed: ' + error.message); return null; }
    const { data: publicURLData } = supabase.storage.from('post_photos').getPublicUrl(fileName);
    return publicURLData.publicUrl;
}

// --- NEW: Story Uploader Modal ---
function StoryUploaderModal({ session, onClose, onStoryUploaded }) {
    const [mediaFile, setMediaFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [mediaType, setMediaType] = useState('image');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setMediaFile(null);
            setPreviewUrl(null);
            return;
        }
        setMediaFile(file);
        setMediaType(file.type.startsWith('video') ? 'video' : 'image');
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
        if (!mediaFile) return;
        setLoading(true);

        // 1. Upload to 'stories' Storage
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('stories')
            .upload(fileName, mediaFile);

        if (uploadError) {
            alert('Error uploading story: ' + uploadError.message);
            setLoading(false);
            return;
        }

        // 2. Get Public URL
        const { data: publicURLData } = supabase.storage.from('stories').getPublicUrl(fileName);
        const media_url = publicURLData.publicUrl;

        // 3. Insert into 'stories' Database Table
        const { error: insertError } = await supabase.from('stories').insert({
            user_id: session.user.id,
            media_url: media_url,
            media_type: mediaType
        });

        if (insertError) {
            alert('Error saving story: ' + insertError.message);
        } else {
            alert('Story uploaded!');
            onStoryUploaded(); // Refresh the feed
            onClose(); // Close the modal
        }
        setLoading(false);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#2C2C2C', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: 'white', margin: 0 }}>Add Your Story</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                </div>

                {previewUrl ? (
                    <div style={{ marginBottom: '20px' }}>
                        {mediaType === 'image' ? (
                            <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '300px', borderRadius: '8px', objectFit: 'contain' }} />
                        ) : (
                            <video src={previewUrl} controls style={{ width: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                        )}
                    </div>
                ) : (
                    <div style={{ height: '200px', border: '2px dashed #4A4A4A', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#757575', marginBottom: '20px' }}>
                        <FaImage style={{ fontSize: '40px', marginBottom: '10px' }} />
                        <p>Select a photo or video</p>
                    </div>
                )}
                
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="story-upload" className="btn btn-secondary" style={{ width: '100%', textDecoration: 'none' }}>
                        {mediaFile ? `Selected: ${mediaFile.name}` : 'Choose Photo/Video'}
                    </label>
                    <input id="story-upload" type="file" accept="image/png, image/jpeg, video/mp4, video/quicktime" onChange={handleFileChange} disabled={loading} style={{ display: 'none' }} />
                </div>

                <button onClick={handleUpload} disabled={!mediaFile || loading} className="btn btn-primary" style={{ width: '100%' }}>
                    {loading ? 'Uploading...' : 'Post Story'}
                </button>
            </div>
        </div>
    );
}

// --- NEW: Story Viewer Modal (MODIFIED FOR CLEANER LOOK) ---
function StoryViewerModal({ stories, profiles, onClose }) {
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

    const nextStory = () => setCurrentStoryIndex(i => {
        if (i + 1 >= stories.length) {
            onClose(); // Close modal when last story finishes
            return i;
        }
        return i + 1;
    });
    
    const prevStory = () => setCurrentStoryIndex(i => (i - 1 < 0 ? 0 : i - 1));

    // Auto-advance timer for images
    useEffect(() => {
        if (stories[currentStoryIndex] && stories[currentStoryIndex].media_type === 'image') {
            const timer = setTimeout(nextStory, 5000); // 5 seconds for images
            return () => clearTimeout(timer);
        }
    }, [currentStoryIndex, stories]);

    if (!stories || stories.length === 0) return null;

    const currentStory = stories[currentStoryIndex];

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#000', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            {/* Story Content (Stop propagation so clicking video doesn't close modal) */}
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                {currentStory.media_type === 'image' ? (
                    <img src={currentStory.media_url} style={{ width: '100%', maxWidth: '450px', objectFit: 'contain' }} />
                ) : (
                    <video 
                        key={currentStory.id} // Forces re-render on story change
                        src={currentStory.media_url} 
                        autoPlay 
                        muted 
                        playsInline
                        onEnded={nextStory} // Auto-advance on video end
                        style={{ width: '100%', maxWidth: '450px' }}
                        // Removed 'controls'
                    />
                )}
            </div>

            {/* Click handlers for next/prev (Stop propagation) */}
            <div onClick={(e) => { e.stopPropagation(); prevStory(); }} style={{ position: 'absolute', left: 0, top: 0, width: '30%', height: '100%' }}></div>
            <div onClick={(e) => { e.stopPropagation(); nextStory(); }} style={{ position: 'absolute', right: 0, top: 0, width: '70%', height: '100%' }}></div>

            {/* Header / Info (MODIFIED) */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '10px', boxSizing: 'border-box', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)' }}>
                {/* Exit Button and User Info REMOVED */}
                
                {/* Progress Bars (Kept) */}
                <div style={{ display: 'flex', gap: '3px', padding: '10px 10px 0 10px' }}>
                    {stories.map((story, index) => (
                        <div key={story.id} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: index <= currentStoryIndex ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)' }} />
                    ))}
                </div>
            </div>
        </div>
    );
}


// --- NEW: StoryReel Component (Rectangle style + Real Media) ---
function StoryReel({ stories, profiles, onAddStory, onViewStory }) {
    const navigate = useNavigate();
    
    // Group stories by user
    const storiesByUser = (stories || []).reduce((acc, story) => {
        if (!acc[story.user_id]) {
            acc[story.user_id] = {
                profile: profiles[story.user_id],
                stories: [],
            };
        }
        acc[story.user_id].stories.push(story);
        return acc;
    }, {});

    // --- STYLES CHANGED TO BE BIGGER ---
    const storyCardStyle = {
        position: 'relative',
        cursor: 'pointer',
        width: '110px', // Bigger width
        height: '180px', // Bigger height
        borderRadius: '8px',
        flexShrink: 0,
        overflow: 'hidden',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        backgroundColor: '#3A3A3A',
    };
    
    const mediaStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    };

    const addStoryCard = {
        ...storyCardStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#E0E0E0',
    };
    // --- END STYLE CHANGES ---

    const storyUsernameStyle = {
        fontSize: '0.8em',
        color: 'white',
        fontWeight: 'bold',
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
    };

    return (
        <div style={{ padding: '10px 0 15px 0', borderBottom: '1px solid #4A4A4A', marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingLeft: '15px' }}>
                {/* Add Story Button */}
                <div style={addStoryCard} onClick={onAddStory}>
                    <FaPlus style={{ fontSize: '24px', marginBottom: '8px' }} />
                    <span style={{ fontSize: '0.8em' }}>Add Story</span>
                </div>

                {/* Other users' stories */}
                {Object.values(storiesByUser).map(({ profile, stories }) => {
                    if (!profile || stories.length === 0) return null;
                    const latestStory = stories[stories.length - 1]; // Show the newest story
                    return (
                        <div key={profile.id} style={storyCardStyle} onClick={() => onViewStory(stories)}>
                            {latestStory.media_type === 'image' ? (
                                <img src={latestStory.media_url} style={mediaStyle} />
                            ) : (
                                <video src={latestStory.media_url + '#t=0.5'} preload="metadata" muted playsInline style={mediaStyle} />
                            )}
                            <span style={storyUsernameStyle}>{profile.username}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
// --- END: StoryReel Component ---


// --- PostList Component (Autoplay videos) ---
function PostList({ posts, profiles, userLikes, onLikeToggle, currentUserId, onDataChange }) {
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // NOTE: PostList no longer shows the "no posts" message
  // It will just be empty if there are no posts.

  const handleShare = async (postContent, postId) => {
    const shareData = { title: 'Post from TerangaHub', text: postContent, url: window.location.origin + '/post/' + postId };
    try {
      if (navigator.share) { await navigator.share(shareData); console.log('Shared'); }
      else { navigator.clipboard.writeText(shareData.url); alert('Link copied!'); }
    } catch (err) { console.error('Share error:', err); }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This will also delete all comments/likes.')) {
        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (error) { alert('Error deleting post: ' + error.message); }
        else { onDataChange(); }
    }
  };

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

  const toggleComments = (postId) => {
    setExpandedPostId(currentId => (currentId === postId ? null : postId));
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {posts.map(post => {
        if (!post || !post.id || !post.user_id) return null;

        const authorProfile = profiles[post.user_id];
        const username = authorProfile ? authorProfile.username || authorProfile.full_name : 'Unknown User';
        const avatarUrl = authorProfile ? authorProfile.avatar_url : null;
        const hasLiked = Array.isArray(userLikes) && userLikes.some(like => like.post_id === post.id);
        const likeCount = post.like_count || 0;
        const commentCount = post.comment_count || 0;
        const isExpanded = expandedPostId === post.id;
        const isOwnPost = post.user_id === currentUserId;

        let postTimeAgo = '';
        try {
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
          // --- THIS IS THE CHANGE: Wrapped post in a "card" ---
          <div 
            key={post.id} 
            style={{ 
                backgroundColor: '#2C2C2C', // --- COLOR CHANGED ---
                borderRadius: '12px', 
                marginBottom: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                overflow: 'hidden' // Keep media inside rounded corners
            }}
          >
            {/* All post content now lives inside the card */}
            <div style={{ padding: '15px' }}>
                {/* Post Author Info + Edit/Delete Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
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
            </div>
            
            {/* --- Media is now outside the padding, edge-to-edge --- */}
            {post.image_url && (
                post.media_type === 'video'
                ? (
                    <video
                        src={post.image_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls
                        style={{ width: '100%', height: 'auto', maxHeight: '400px', display: 'block', backgroundColor: 'black' }}
                    />
                )
                : (
                    <img
                        src={post.image_url}
                        alt="Post media"
                        style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover', display: 'block' }}
                    />
                )
            )}

            {/* --- Actions/Comments are back inside padding --- */}
            <div style={{ padding: '0 15px 15px 15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderTop: '1px solid #3A3A3A', paddingTop: '15px', marginTop: '15px' }}>
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

                  <button
                     onClick={() => handleShare(post.content, post.id)}
                     style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', fontSize: '1.2em', color: '#A6D1E6', marginLeft: 'auto' }}
                     aria-label="Share post"
                  >
                     <RiShareForwardLine />
                  </button>
                </div>

                {/* This is now nested inside the card */}
                {isExpanded && <CommentSection postId={post.id} userId={currentUserId} onCommentChange={onDataChange} onClose={() => toggleComments(post.id)} />}
            </div>
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
            media_type = mediaFile.type.startsWith('video') ? 'video' : 'image';
        }

        const { error } = await supabase.from('posts').insert({ 
            user_id: userId, 
            content: content.trim(), 
            image_url: mediaUrl, 
            media_type: media_type
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

    // --- NEW: Wrapped CreatePost in a card ---
    return (
        <div style={{ backgroundColor: '#2C2C2C', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
            <form onSubmit={handleSubmit}>
                <textarea
                    placeholder="What's on your mind, Teranga?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows="3"
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', boxSizing: 'border-box', marginBottom: '10px', borderRadius: '6px', border: '1px solid #BDBDBD', resize: 'vertical', backgroundColor: '#FFFFFF', color: '#121212' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
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
        </div>
    );
}

// --- Main Feed Component (NEW STATE FOR MODALS) ---
export default function Feed({ session }) {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]); 
  const [profiles, setProfiles] = useState({}); // Changed to object for quick lookup
  const [userLikes, setUserLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshToggle, setRefreshToggle] = useState(0);

  // --- NEW STATE FOR MODALS ---
  const [showUploaderModal, setShowUploaderModal] = useState(false);
  const [viewingUserStories, setViewingUserStories] = useState(null); // Will hold the array of stories to view

  async function fetchFeed() {
    setLoading(true);
    const currentUserId = session.user.id;

    // 1. Fetch Stories
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('id, user_id, media_url, media_type, created_at')
        .gt('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

    if (storiesError) { console.error('Err fetch stories:', storiesError); }
    setStories(storiesData || []);

    // 2. Fetch Posts
    const { data: postsData, error: postsError } = await supabase.from('posts').select('id, user_id, created_at, updated_at, content, image_url, media_type, likes ( count ), comments ( count )').order('created_at', { ascending: false });
    if (postsError) { console.error('Err fetch posts:', postsError); setLoading(false); return; }
    
    const postsWithCounts = (postsData || []).map(post => ({ ...post, like_count: post.likes && post.likes[0] ? post.likes[0].count : 0, comment_count: post.comments && post.comments[0] ? post.comments[0].count : 0 }));
    setPosts(postsWithCounts);
    
    // 3. Get all unique user IDs from both
    const postUserIds = postsWithCounts.map(post => post.user_id);
    const storyUserIds = (storiesData || []).map(story => story.user_id);
    const userIds = [...new Set([...postUserIds, ...storyUserIds, currentUserId])];

    if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', userIds);
        if (profilesError) { console.error('Err fetch profiles:', profilesError); }
        // Convert profiles array to an object for fast lookup
        const profilesMap = (profilesData || []).reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
        }, {});
        setProfiles(profilesMap);
    } else { setProfiles({}); }
     
    // 4. Fetch Likes
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
    return <div style={{ textAlign: 'center', marginTop: '50px', color: '#E0E0E0' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0' }}>
      {/* --- NEW: Render Modals --- */}
      {showUploaderModal && (
          <StoryUploaderModal 
              session={session} 
              onClose={() => setShowUploaderModal(false)} 
              onStoryUploaded={handleDataChange} 
          />
      )}
      {viewingUserStories && (
          <StoryViewerModal 
              stories={viewingUserStories}
              profiles={profiles}
              onClose={() => setViewingUserStories(null)}
          />
      )}

      {/* --- MODIFIED: Added padding here --- */}
      <div style={{ padding: '0 15px' }}>
        <header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0', paddingBottom: '10px', borderBottom: '1px solid #4A4A4A' }}>
          {/* --- MODIFIED: Changed title --- */}
          <h1 style={{ color: '#E0E0E0', margin: 0, fontSize: '1.5em' }}>Community</h1>
        </header>
      </div>

      <StoryReel 
          stories={stories} 
          profiles={profiles} 
          onAddStory={() => setShowUploaderModal(true)}
          onViewStory={(userStories) => setViewingUserStories(userStories)}
      />

      {/* --- MODIFIED: Added padding and new Card wrapper --- */}
      <div style={{ padding: '0 15px', marginTop: '20px' }}>
        <CreatePost userId={session.user.id} onPostCreated={handleDataChange} />
      </div>
      
      {/* --- MODIFIED: Added padding here --- */}
      <div style={{ padding: '0 15px' }}>
        <PostList
          posts={posts}
          profiles={profiles}
          userLikes={userLikes}
          onLikeToggle={handleLikeToggle}
          currentUserId={session.user.id}
          onDataChange={handleDataChange}
        />
      </div>

      {/* --- NEW: Message if feed is empty --- */}
      {!loading && posts.length === 0 && (
          <div style={{ padding: '40px 15px', textAlign: 'center' }}>
              <FaVideo style={{ fontSize: '40px', color: '#4A4A4A', marginBottom: '10px' }} />
              <h3 style={{ color: 'white' }}>Welcome to the Community</h3>
              <p style={{ color: '#BDBDBD' }}>Be the first to share a post or add to your story.</p>
          </div>
      )}
    </div>
  );
}