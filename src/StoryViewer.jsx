import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaArrowLeft } from 'react-icons/fa';

export default function StoryViewer() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [stories, setStories] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

    // Fetch stories and profile for the user in the URL
    useEffect(() => {
        const fetchStoryData = async () => {
            setLoading(true);

            // 1. Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', userId)
                .single();
            
            if (profileError) console.error('Error fetching profile:', profileError);
            setProfile(profileData);

            // 2. Fetch stories (last 24 hours)
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: storiesData, error: storiesError } = await supabase
                .from('stories')
                .select('id, media_url, media_type, created_at')
                .eq('user_id', userId)
                .gt('created_at', twentyFourHoursAgo)
                .order('created_at', { ascending: true }); // Oldest to newest

            if (storiesError) console.error('Error fetching stories:', storiesError);
            setStories(storiesData || []);
            
            setLoading(false);
        };

        fetchStoryData();
    }, [userId]);

    // Go to next story
    const nextStory = () => {
        setCurrentStoryIndex((prevIndex) => {
            if (prevIndex + 1 >= stories.length) {
                navigate('/feed'); // All stories done, go back to feed
                return prevIndex;
            }
            return prevIndex + 1;
        });
    };

    // Go to previous story
    const prevStory = () => {
        setCurrentStoryIndex((prevIndex) => {
            if (prevIndex - 1 < 0) {
                return 0; // Can't go back further
            }
            return prevIndex - 1;
        });
    };

    // Auto-advance timer for images
    useEffect(() => {
        if (!loading && stories[currentStoryIndex]) {
            const currentStory = stories[currentStoryIndex];
            if (currentStory.media_type === 'image') {
                const timer = setTimeout(() => {
                    nextStory();
                }, 5000); // 5 seconds for images
                return () => clearTimeout(timer); // Clear timer if component unmounts
            }
        }
    }, [currentStoryIndex, stories, loading]);


    if (loading) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: '50vh' }}>Loading story...</div>;
    }

    if (stories.length === 0) {
        alert('No active stories found for this user.');
        navigate('/feed');
        return null;
    }

    const currentStory = stories[currentStoryIndex];
    if (!currentStory) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#000', zIndex: 1000 }}>
            {/* Story Content */}
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentStory.media_type === 'image' ? (
                    <img src={currentStory.media_url} style={{ width: '100%', maxWidth: '450px', objectFit: 'contain' }} />
                ) : (
                    <video 
                        src={currentStory.media_url} 
                        controls 
                        autoPlay 
                        onEnded={nextStory} // Go to next story when video finishes
                        style={{ width: '100%', maxWidth: '450px' }}
                    />
                )}
            </div>

            {/* Click handlers for next/prev */}
            <div onClick={prevStory} style={{ position: 'absolute', left: 0, top: 0, width: '30%', height: '100%' }}></div>
            <div onClick={nextStory} style={{ position: 'absolute', right: 0, top: 0, width: '70%', height: '100%' }}></div>

            {/* Header / Info */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '10px', boxSizing: 'border-box', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)' }}>
                {/* Back Button */}
                <button onClick={() => navigate('/feed')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', position: 'absolute', top: '15px', right: '15px' }}>
                    &times;
                </button>
                
                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}>
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <FaUserCircle style={{ fontSize: '40px', color: '#4A4A4A' }} />
                    )}
                    <span style={{ color: 'white', fontWeight: 'bold' }}>{profile?.username}</span>
                </div>

                {/* Progress Bars */}
                <div style={{ display: 'flex', gap: '3px', padding: '0 10px' }}>
                    {stories.map((story, index) => (
                        <div key={story.id} style={{ flex: 1, height: '3px', borderRadius: '2px', backgroundColor: index <= currentStoryIndex ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)' }} />
                    ))}
                </div>
            </div>
        </div>
    );
}