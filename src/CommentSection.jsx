import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { FaTrash, FaUserCircle, FaPencilAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom'; // Import Link

// --- Component to display a single comment (UPDATED with Edit Functionality) ---
function Comment({ comment, profiles, currentUserId, onCommentDeleted }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editingContent, setEditingContent] = useState(comment.content);
    
    const authorProfile = profiles.find(p => p.id === comment.user_id);
    const username = authorProfile ? authorProfile.username || authorProfile.full_name : 'Unknown User';
    const avatarUrl = authorProfile ? authorProfile.avatar_url : null;
    const isOwnComment = comment.user_id === currentUserId;

    let timeAgo = '';
    try {
        // NEW: Check if comment was edited
        const dateToFormat = comment.updated_at ? new Date(comment.updated_at) : new Date(comment.created_at);
        timeAgo = formatDistanceToNow(dateToFormat, { addSuffix: true });
        timeAgo = timeAgo.replace('about ', '');
        if (comment.updated_at) {
            timeAgo += ' (edited)';
        }
    } catch (e) {
        console.error('Error formatting date:', e);
        timeAgo = 'just now';
    }

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', comment.id);

            if (error) {
                alert('Error deleting comment: ' + error.message);
            } else {
                onCommentDeleted(); // Notify parent to refresh
            }
        }
    };

    // --- NEW: Edit Comment Handlers ---
    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditingContent(comment.content); // Reset text
    };

    const handleEditSave = async () => {
        setEditLoading(true);
        const { error } = await supabase
            .from('comments')
            .update({ content: editingContent, updated_at: new Date() })
            .eq('id', comment.id);
        
        setEditLoading(false);
        if (error) {
            alert('Error updating comment: ' + error.message);
        } else {
            setIsEditing(false);
            onCommentDeleted(); // We can reuse this to trigger a refresh
        }
    };
    // --- END: Edit Comment Handlers ---

    return (
        <div style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #4A5568', display: 'flex', gap: '10px' }}>
            {/* AVATAR IS NOW A LINK */}
            <Link to={`/profile/${comment.user_id}`} style={{ flexShrink: 0 }}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={username} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                    <FaUserCircle style={{ fontSize: '32px', color: '#4A4A4A' }} />
                )}
            </Link>

            {/* Comment Content Column */}
            <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link to={`/profile/${comment.user_id}`} style={{ textDecoration: 'none' }}>
                            <p style={{ fontWeight: 'bold', margin: 0, fontSize: '0.9em', color: '#8AFF8A' }}>{username}</p>
                        </Link>
                        <p style={{ margin: 0, fontSize: '0.8em', color: '#757575' }}>{timeAgo}</p>
                    </div>
                    {isOwnComment && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button
                                onClick={handleEditClick}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#757575', fontSize: '0.8em' }}
                                aria-label="Edit comment"
                            >
                                <FaPencilAlt />
                            </button>
                            <button
                                onClick={handleDelete}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#757575', fontSize: '0.8em' }}
                                aria-label="Delete comment"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    )}
                </div>
                
                {/* --- NEW: Conditional Edit/View for Comment Content --- */}
                {isEditing ? (
                    <div style={{ marginTop: '5px' }}>
                        <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows="2"
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #BDBDBD', resize: 'vertical', backgroundColor: '#FFFFFF', color: '#121212' }}
                            disabled={editLoading}
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                            <button onClick={handleEditSave} className="btn btn-secondary" style={{ width: 'auto', padding: '5px 10px', fontSize: '0.8em' }} disabled={editLoading}>
                                {editLoading ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={handleEditCancel} className="btn btn-muted" style={{ width: 'auto', padding: '5px 10px', fontSize: '0.8em' }} disabled={editLoading}>
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <p style={{ margin: 0, color: '#E0E0E0', textAlign: 'left', wordWrap: 'break-word' }}>{comment.content}</p>
                )}
                {/* --- END OF CHANGE --- */}

            </div>
        </div>
    );
}

// --- Component to add a new comment (Unchanged) ---
function AddComment({ postId, userId, onCommentAdded, onClose }) {
    const [content, setContent] = useState(''); const [loading, setLoading] = useState(false); const handleSubmit = async (e) => { e.preventDefault(); if (!content.trim()) return; setLoading(true); const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: userId, content: content.trim() }); setLoading(false); if (error) { alert('Error: ' + error.message); } else { setContent(''); onCommentAdded(); } }; return ( <form onSubmit={handleSubmit} style={{ marginTop: '15px' }}> <textarea placeholder="Write a comment..." value={content} onChange={(e) => setContent(e.target.value)} rows="2" disabled={loading} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '8px', borderRadius: '6px', border: '1px solid #BDBDBD', resize: 'vertical', backgroundColor: '#FFFFFF', color: '#121212' }} /> <div style={{ display: 'flex', gap: '10px' }}> <button type="submit" disabled={loading || !content.trim()} className="btn btn-secondary" style={{ width: 'auto', padding: '8px 15px', fontSize: '0.9em' }}> {loading ? 'Posting...' : 'Post Comment'} </button> <button type="button" onClick={onClose} className="btn btn-muted" style={{ width: 'auto', padding: '8px 15px', fontSize: '0.9em' }}> Cancel </button> </div> </form> );
}

// --- Main Comment Section Component (UPDATED to fetch updated_at) ---
export default function CommentSection({ postId, userId, onCommentChange, onClose }) {
    const [comments, setComments] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshToggle, setRefreshToggle] = useState(0);

    async function fetchComments() {
        setLoading(true);
        // Fetch 'updated_at' along with other comment data
        const { data: commentsData, error: commentsError } = await supabase.from('comments').select('*, updated_at').eq('post_id', postId).order('created_at', { ascending: true });
        if (commentsError) { console.error('Err fetch comments:', commentsError); setLoading(false); return; }
        setComments(commentsData || []);
        const userIds = [...new Set((commentsData || []).map(comment => comment.user_id))];
        if (userIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', userIds);
            if (profilesError) { console.error('Err fetch comment profiles:', profilesError); }
            setProfiles(profilesData || []);
        } else { setProfiles([]); }
        setLoading(false);
    }

    useEffect(() => {
        fetchComments();
    }, [postId, refreshToggle]);

    const handleCommentChange = () => {
        setRefreshToggle(prev => prev + 1);
        if (onCommentChange) onCommentChange();
    };

    return (
        <div style={{ marginTop: '10px', paddingTop: '10px' }}>
            {loading ? (
                <p style={{ color: '#A0AEC0' }}>Loading comments...</p>
            ) : comments.length === 0 ? (
                <p style={{ color: '#A0AEC0', fontSize: '0.9em', fontStyle: 'italic' }}>No comments yet.</p>
            ) : (
                comments.map(comment => (
                    <Comment
                        key={comment.id}
                        comment={comment}
                        profiles={profiles}
                        currentUserId={userId}
                        onCommentDeleted={handleCommentChange}
                    />
                ))
            )}
            <AddComment
                postId={postId}
                userId={userId}
                onCommentAdded={handleCommentChange}
                onClose={onClose}
            />
        </div>
    );
}