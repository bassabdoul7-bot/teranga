import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa'; // Placeholder icon

// Component for a single conversation row
function ConversationRow({ conversation, currentUserId }) {
    // Find the *other* participant's profile
    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);

    // Determine the display name and avatar
    let displayName = 'Chat';
    let avatarUrl = null;
    if (otherParticipant) {
        displayName = otherParticipant.username || otherParticipant.full_name || 'Unknown User';
        avatarUrl = otherParticipant.avatar_url;
    } else {
        displayName = "Group Chat (or empty)"; // Fallback
    }

    return (
        <Link to={`/chat/${conversation.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px', 
                padding: '10px', 
                borderBottom: '1px solid #4A4A4A', 
                backgroundColor: '#1E1E1E', 
                borderRadius: '8px', 
                marginBottom: '10px' 
            }}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                    <FaUserCircle style={{ fontSize: '45px', color: '#4A4A4A' }} />
                )}
                <div>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#E0E0E0' }}>{displayName}</p>
                    {/* We can add 'last message' preview here later */}
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.9em', color: '#A0AEC0' }}>Click to view messages...</p>
                </div>
            </div>
        </Link>
    );
}


// Main Chat List Component
export default function ChatList({ session }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchConversations() {
            setLoading(true);
            const currentUserId = session.user.id;

            // 1. Get all conversation IDs the user is in.
            const { data: convoParticipants, error: convoError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', currentUserId);

            if (convoError) {
                console.error('Error fetching conversation list:', convoError);
                setLoading(false);
                return;
            }
            
            const convoIds = convoParticipants.map(c => c.conversation_id);

            if (convoIds.length === 0) {
                setLoading(false);
                return; // No conversations to show
            }

            // 2. Get all participant details for those conversations, joining their profiles
            const { data: allParticipants, error: participantsError } = await supabase
                .from('conversation_participants')
                .select('conversation_id, user_id, profiles ( id, username, full_name, avatar_url )') // Use join
                .in('conversation_id', convoIds);

            if (participantsError) {
                console.error('Error fetching participants:', participantsError);
                setLoading(false);
                return;
            }

            // 3. Process the data to group participants by conversation
            const convos = {};
            for (const participant of allParticipants) {
                const convoId = participant.conversation_id;
                if (!convos[convoId]) {
                    convos[convoId] = { id: convoId, participants: [] };
                }
                // Add the profile data to the participants array
                if (participant.profiles) {
                    convos[convoId].participants.push(participant.profiles);
                }
            }
            
            setConversations(Object.values(convos));
            setLoading(false);
        }

        fetchConversations();
    }, [session.user.id]);

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '15px' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #4A4A4A' }}>
                <h1 style={{ color: '#E0E0E0', margin: 0, fontSize: '1.5em' }}>My Messages</h1>
            </header>
            
            {/* Conversation List */}
            <div>
                {loading ? (
                    <p style={{ color: '#A0AEC0', textAlign: 'center' }}>Loading conversations...</p>
                ) : conversations.length === 0 ? (
                    <p style={{ color: '#A0AEC0', textAlign: 'center' }}>You have no messages. Start a chat from a user's profile.</p>
                ) : (
                    conversations.map(convo => (
                        <ConversationRow 
                            key={convo.id} 
                            conversation={convo} 
                            currentUserId={session.user.id} 
                        />
                    ))
                )}
            </div>
        </div>
    );
}