import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import { formatDistanceToNow } from 'date-fns';
import { FaUserCircle } from 'react-icons/fa';

// (UserPost component remains the same)
function UserPost({ post }) {
    let postTimeAgo = '';
    try {
        postTimeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
        postTimeAgo = postTimeAgo.replace('about ', '');
    } catch (e) { postTimeAgo = 'just now'; }

    return (
        <div style={{ padding: '15px 0', borderBottom: '1px solid #4A5A6A' }}>
            <p style={{ margin: 0, fontSize: '0.8em', color: '#757575' }}>{postTimeAgo}</p>
            <p style={{ margin: '10px 0 0 0', fontSize: '1.1em', wordWrap: 'break-word', color: '#E0E0E0' }}>
                {post.content}
            </p>
            {post.image_url && (
                 <img
                    src={post.image_url}
                    alt="Post media"
                    style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', marginTop: '15px' }}
                />
            )}
        </div>
    );
}

// --- NEW: Manage Business Form Component ---
function ManageBusinessForm({ session, existingBusinessData, onSave }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        address: '',
        phone: '',
        website: ''
    });

    // Effect to fill form when existing data is loaded
    useEffect(() => {
        if (existingBusinessData) {
            setFormData({
                name: existingBusinessData.name || '',
                description: existingBusinessData.description || '',
                category: existingBusinessData.category || '',
                address: existingBusinessData.address || '',
                phone: existingBusinessData.phone || '',
                website: existingBusinessData.website || ''
            });
        }
    }, [existingBusinessData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        const { user } = session;
        const updates = {
            ...formData,
            user_id: user.id,
            updated_at: new Date()
        };

        // If they have a business, add the ID for the upsert to match
        if (existingBusinessData && existingBusinessData.id) {
            updates.id = existingBusinessData.id;
        }

        const { data, error } = await supabase
            .from('businesses')
            .upsert(updates)
            .select() // Return the saved data
            .single();

        if (error) {
            alert('Error saving business: ' + error.message);
        } else {
            alert('Business profile saved!');
            onSave(data); // Pass the newly saved data back to parent
        }
        setLoading(false);
    };
    
    // Styles copied from your profile form
    const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '0.9em', color: '#BDBDBD' };
    const inputStyle = { width: '100%', padding: '10px', boxSizing: 'border-box', backgroundColor: '#2C2C2C', color: '#FFFFFF', border: '1px solid #4A4A4A', borderRadius: '6px' };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
                <label htmlFor="bus_name" style={labelStyle}>Business Name</label>
                <input id="bus_name" name="name" type="text" required value={formData.name} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
                <label htmlFor="bus_desc" style={labelStyle}>Description</label>
                <textarea id="bus_desc" name="description" value={formData.description} onChange={handleChange} style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} />
            </div>
            <div>
                <label htmlFor="bus_cat" style={labelStyle}>Category (e.g., Restaurant, Shop, Service)</label>
                <input id="bus_cat" name="category" type="text" value={formData.category} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
                <label htmlFor="bus_addr" style={labelStyle}>Address</label>
                <input id="bus_addr" name="address" type="text" value={formData.address} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
                <label htmlFor="bus_phone" style={labelStyle}>Phone Number</label>
                <input id="bus_phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
                <label htmlFor="bus_web" style={labelStyle}>Website (include https://)</label>
                <input id="bus_web" name="website" type="url" value={formData.website} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{marginTop: '10px'}}>
                <button type="submit" disabled={loading} className="btn btn-primary">
                    {loading ? 'Saving...' : (existingBusinessData ? 'Update Business' : 'Create Business')}
                </button>
            </div>
        </form>
    );
}

// --- Main Profile Component (UPDATED) ---
export default function Profile({ session, setSession }) {
  const { userId: profileUserIdFromUrl } = useParams();
  const profileUserId = profileUserIdFromUrl || session.user.id;
  const isOwnProfile = profileUserId === session.user.id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({ username: null, full_name: null, avatar_url: null });
  const [businessData, setBusinessData] = useState(null); // <-- NEW STATE
  const [userPosts, setUserPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function getProfileAndPosts() {
      setLoading(true); setIsFollowing(false); setProfileData({ username: null, full_name: null, avatar_url: null }); setUserPosts([]); setBusinessData(null);
      
      // 1. Get profile
      const { data, error } = await supabase.from('profiles').select('username, full_name, avatar_url').eq('id', profileUserId).single();
      if (!ignore) { if (error) { console.warn('Err profile:', error); setProfileData({ username: 'Not Found', full_name: '', avatar_url: null }); } else if (data) { setProfileData(data); } }
      
      // 2. Check follow status (if not own profile)
      if (!isOwnProfile && !ignore) {
          setFollowLoading(true);
          const { data: followData, error: followError } = await supabase.from('followers').select('id').eq('follower_id', session.user.id).eq('following_id', profileUserId).maybeSingle();
          if (followError) { console.error('Err follow status:', followError); } else { setIsFollowing(!!followData); }
          setFollowLoading(false);
      }
      
      // 3. Get user's posts
      if (!ignore) {
          const { data: postsData, error: postsError } = await supabase.from('posts').select('id, created_at, content, image_url').eq('user_id', profileUserId).order('created_at', { ascending: false });
          if (postsError) { console.error('Err user posts:', postsError); } else { setUserPosts(postsData || []); }
      }

      // 4. --- NEW: Get user's business (if own profile) ---
      if (isOwnProfile && !ignore) {
        const { data: busData, error: busError } = await supabase
            .from('businesses')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle(); // Use maybeSingle() in case they don't have a business yet
    
        if (busError) {
            console.error('Error fetching business:', busError);
        } else if (busData) {
            setBusinessData(busData);
        }
      }
      // --- END OF NEW PART ---

      setLoading(false);
    }
    getProfileAndPosts();
    return () => { ignore = true; };
  }, [profileUserId, session.user.id, isOwnProfile]);


  async function updateProfile(event) {
    event.preventDefault(); setLoading(true); const { user } = session;
    const updates = { id: user.id, username: profileData.username, full_name: profileData.full_name, avatar_url: profileData.avatar_url, updated_at: new Date(), };
    const { error } = await supabase.from('profiles').upsert(updates);
    if (error) { alert('Error: ' + error.message); } else { alert('Profile updated!'); }
    setLoading(false);
  }

  const handleLogout = async () => {
      const { error } = await supabase.auth.signOut(); if (error) { console.error('Error logout:', error); } else { setSession(null); }
  };

  const handleFollowToggle = async () => {
      setFollowLoading(true); const currentUserId = session.user.id; if (isFollowing) { const { error } = await supabase.from('followers').delete().match({ follower_id: currentUserId, following_id: profileUserId }); if (error) { alert('Error unfollowing: ' + error.message); } else { setIsFollowing(false); } } else { const { error } = await supabase.from('followers').insert({ follower_id: currentUserId, following_id: profileUserId }); if (error) { if (error.code === '23505') { setIsFollowing(true); } else { alert('Error following: ' + error.message); } } else { setIsFollowing(true); } } setFollowLoading(false);
  };

  async function handleAvatarUpload(filePath) {
    setLoading(true); const { user } = session;
    const updates = { id: user.id, avatar_url: filePath, updated_at: new Date() };
    const { error } = await supabase.from('profiles').upsert(updates);
    if (error) { alert('Error updating avatar: ' + error.message); }
    else { setProfileData(prev => ({ ...prev, avatar_url: filePath })); alert('Avatar updated!'); }
    setLoading(false);
  }

  const handleStartChat = async () => {
      setChatLoading(true);
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
          target_user_id: profileUserId
      });
      setChatLoading(false);
      if (error) {
          alert('Error starting chat: ' + error.message);
      } else {
          const conversationId = data;
          navigate(`/chat/${conversationId}`);
      }
  };

  // --- Render Logic ---
  return (
    <div style={{ maxWidth: '600px', margin: '30px auto', padding: '15px' }}>

        {/* Header Area */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
            <Link to="/feed" className="btn btn-muted" style={{ width: 'auto', padding: '8px 12px', marginRight: 'auto' }}>
                &larr; Back
            </Link>
            <h2 style={{ margin: '0 auto 0 auto', color: '#FFFFFF', textAlign: 'center' }}>
                {isOwnProfile ? 'My Account' : (profileData.username || 'User Profile')}
            </h2>
              <div style={{width: '60px'}}></div> {/* Spacer */}
        </div>

        {/* --- Profile Card --- */}
        <div style={{ backgroundColor: '#1E1E1E', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', marginBottom: '30px' }}>
            {loading ? (
                  <p style={{textAlign: 'center', color: '#BDBDBD'}}>Loading profile...</p>
            ) : (
                <>
                    {/* Avatar Component */}
                    <Avatar
                        url={profileData.avatar_url}
                        size={120}
                        userId={session.user.id}
                        onUpload={isOwnProfile ? handleAvatarUpload : null}
                    />

                    {/* IF OWN PROFILE: Show Edit Form */}
                    {isOwnProfile && (
                        <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '20px' }}>
                            {/* ... (Email, Username, Full Name inputs) ... */}
                            <div>
                                <label htmlFor="email" style={{ display: 'block', marginBottom: '6px', fontSize: '0.9em', color: '#BDBDBD' }}>Email</label>
                                <input id="email" type="text" value={session.user.email} disabled style={{ width: '100%', padding: '10px', boxSizing: 'border-box', backgroundColor: '#3A3A3A', color: '#BDBDBD', border: '1px solid #4A4A4A', borderRadius: '6px', cursor: 'not-allowed' }} />
                            </div>
                            <div>
                                <label htmlFor="username" style={{ display: 'block', marginBottom: '6px', fontSize: '0.9em', color: '#BDBDBD' }}>Username</label>
                                <input id="username" type="text" required value={profileData.username || ''} onChange={(e) => setProfileData({...profileData, username: e.target.value})} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', backgroundColor: '#2C2C2C', color: '#FFFFFF', border: '1px solid #4A4A4A', borderRadius: '6px' }} />
                            </div>
                            <div>
                                <label htmlFor="fullName" style={{ display: 'block', marginBottom: '6px', fontSize: '0.9em', color: '#BDBDBD' }}>Full Name</label>
                                <input id="fullName" type="text" value={profileData.full_name || ''} onChange={(e) => setProfileData({...profileData, full_name: e.target.value})} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', backgroundColor: '#2C2C2C', color: '#FFFFFF', border: '1px solid #4A4A4A', borderRadius: '6px' }} />
                            </div>
                            <div style={{marginTop: '10px'}}>
                                <button type="submit" disabled={loading} className="btn btn-primary">
                                    {loading ? 'Saving ...' : 'Update Profile'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* --- IF OTHER'S PROFILE: Show Info & Action Buttons --- */}
                    {!isOwnProfile && (
                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                            <h3 style={{ color: '#FFFFFF', margin: '10px 0 0 0' }}>{profileData.username || '...'}</h3>
                            <p style={{ color: '#BDBDBD', margin: '5px 0 20px 0' }}>{profileData.full_name || ''}</p>

                            {/* Action Button Container */}
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                    onClick={handleFollowToggle}
                                    disabled={followLoading || chatLoading}
                                    className={isFollowing ? 'btn btn-muted' : 'btn btn-primary'}
                                    style={{ width: 'auto', flex: 1 }}
                                >
                                    {followLoading ? '...' : (isFollowing ? 'Unfollow' : 'Follow')}
                                </button>
                                <button
                                    onClick={handleStartChat}
                                    disabled={followLoading || chatLoading}
                                    className="btn btn-secondary" // Gold button
                                    style={{ width: 'auto', flex: 1 }}
                                >
                                    {chatLoading ? '...' : 'Message'}
                                </button>
                            </div>
                       </div>
                    )}
                </>
            )}
        </div>
        
        {/* --- NEW: Manage Business Card (Only for own profile) --- */}
        {isOwnProfile && (
            <div style={{ backgroundColor: '#1E1E1E', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', marginBottom: '30px' }}>
                <h3 style={{ color: '#FFFFFF', margin: '0 0 20px 0', textAlign: 'center' }}>
                    {businessData ? 'Edit My Business' : 'Register My Business'}
                </h3>
                {loading ? (
                    <p style={{textAlign: 'center', color: '#BDBDBD'}}>Loading business data...</p>
                ) : (
                    <ManageBusinessForm
                        session={session}
                        existingBusinessData={businessData}
                        onSave={(savedData) => setBusinessData(savedData)}
                    />
                )}
            </div>
        )}
        {/* --- END OF NEW CARD --- */}

        {/* --- Logout Button (Only for own profile) --- */}
        {isOwnProfile && (
            <button type="button" onClick={handleLogout} className="btn btn-destructive" style={{ marginTop: '30px' }}>
                Logout
            </button>
        )}

        {/* --- User's Post Feed (Show for BOTH) --- */}
        <div style={{ marginTop: '30px' }}>
            <h2 style={{ color: '#E0E0E0', borderBottom: '1px solid #4A4A4A', paddingBottom: '5px' }}>
                Posts
            </h2>
            {loading ? (
                <p style={{ color: '#A0AEC0', textAlign: 'center' }}>Loading posts...</p>
            ) : userPosts.length === 0 ? (
                <p style={{ color: '#A0AEC0', textAlign: 'center', marginTop: '20px' }}>This user hasn't posted anything yet.</p>
            ) : (
                <div style={{ marginTop: '20px' }}>
                    {userPosts.map(post => (
                        <UserPost key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>

    </div>
  );
}