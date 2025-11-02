import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaUserCircle } from 'react-icons/fa';

// --- Single Message Component ---
function Message({ message, profile, isOwnMessage }) {
    const avatarUrl = profile ? profile.avatar_url : null;
    const username = profile ? profile.username : 'Unknown';
    
    const messageStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        marginBottom: '10px',
    };

    const bubbleStyle = {
        backgroundColor: isOwnMessage ? '#39FF14' : '#2C2C2C', // Neon Green for self, Dark Gray for other
        color: isOwnMessage ? '#121212' : '#E0E0E0', // Black text for self, Light text for other
        padding: '10px 15px',
        borderRadius: '18px',
        maxWidth: '70%',
        wordWrap: 'break-word',
    };
    
    const metaStyle = {
        fontSize: '0.8em',
        color: '#757575',
        marginTop: '3px',
        padding: '0 5px',
    };

    return (
        <div style={messageStyle}>
            <div style={bubbleStyle}>
                {message.content}
            </div>
            <span style={metaStyle}>
                {!isOwnMessage ? `${username} - ` : ''}
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true }).replace('about ', '')}
            </span>
        </div>
    );
}

// --- Main Chat Room Component ---
export default function ChatRoom({ session }) {
    const { conversationId } = useParams(); // Get chat ID from URL: /chat/:conversationId
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [profiles, setProfiles] = useState([]); // Store profiles of participants
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null); // Ref to auto-scroll to bottom

    // Helper to scroll to the latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch initial messages and participant profiles
    useEffect(() => {
        async function fetchMessagesAndProfiles() {
            if (!conversationId) return;
            
            setLoading(true);

            // 1. Fetch all messages
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (messagesError) console.error('Error fetching messages:', messagesError);
            else setMessages(messagesData || []);

            // 2. Fetch all participants
            const { data: participantsData, error: participantsError } = await supabase
                .from('conversation_participants')
                .select('user_id')
                .eq('conversation_id', conversationId);
            
            if (participantsError) console.error('Error fetching participants:', participantsError);

            // 3. Fetch profiles for those participants
            if (participantsData && participantsData.length > 0) {
                const userIds = participantsData.map(p => p.user_id);
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', userIds);
                
                if (profilesError) console.error('Error fetching profiles:', profilesError);
                else setProfiles(profilesData || []);
            }
            
            setLoading(false);
        }
        
        fetchMessagesAndProfiles();
    }, [conversationId]);

    // Scroll to bottom when messages load or new one arrives
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // --- REALTIME SUBSCRIPTION (FIXED) ---
    useEffect(() => {
        if (!conversationId) return;

        const handleNewMessage = (payload) => {
            setMessages(currentMessages => {
                // Check if message (from optimistic update) or real message is already present
                if (currentMessages.find(m => m.id === payload.new.id || m.id === payload.new.temp_id)) {
                    return currentMessages;
                }
                return [...currentMessages, payload.new];
            });
        };

        const channel = supabase.channel(`public:messages:conversation_id=eq.${conversationId}`)
            .on(
                'postgres_changes', 
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                }, 
                handleNewMessage 
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    // --- Handle Sending a New Message ---
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (content === '') return;

        setSending(true);
        
        const tempId = `temp-${Date.now()}`;
        const newMessagePayload = {
            id: tempId, // Use temp ID for key and optimistic update
            created_at: new Date().toISOString(),
            content: content,
            sender_id: session.user.id,
            conversation_id: conversationId
        };

        // --- OPTIMISTIC UPDATE ---
        setMessages(currentMessages => [ ...currentMessages, newMessagePayload ]);
        setNewMessage(''); // Clear input immediately
        
        // Send the real data to Supabase (without the temp ID)
        const { error } = await supabase
            .from('messages')
            .insert({
                content: newMessagePayload.content,
                sender_id: newMessagePayload.sender_id,
                conversation_id: newMessagePayload.conversation_id
            });
        
        setSending(false);
        if (error) {
            // --- THIS IS THE CORRECTED LINE ---
            alert('Error sending message: ' + error.message);
            // Remove the failed optimistic message
            setMessages(currentMessages => currentMessages.filter(m => m.id !== tempId));
        }
        // If successful, the real-time sub will eventually replace the temp message
        // or just add the real one (which handleNewMessage will de-duplicate)
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '15px', height: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #4A4A4A', flexShrink: 0 }}>
                <Link to="/chat" className="btn btn-muted" style={{ width: 'auto', padding: '8px 12px', marginRight: 'auto' }}>
                    ← Back to Chats
                </Link>
                <h1 style={{ color: '#E0E0E0', margin: '0 auto', fontSize: '1.2em' }}>
                    Chat Room
                </h1>
                <div style={{width: '60px'}}></div> {/* Spacer */}
            </header>
            
            {/* Message List */}
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '0 10px' }}>
                {loading && <p style={{ color: '#A0AEC0', textAlign: 'center' }}>Loading messages...</p>}
                {!loading && messages.map(msg => {
                    const profile = profiles.find(p => p.id === msg.sender_id);
                    return (
                        <Message 
                            key={msg.id} // Use the database ID or temp ID
                            message={msg} 
                            profile={profile} 
                            isOwnMessage={msg.sender_id === session.user.id} 
                        />
                    );
                })}
                {/* This empty div is the target for auto-scrolling */}
                <div ref={messagesEndRef} />
            </div>

            {/* Send Message Form */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: '10px', flexShrink: 0 }}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                    style={{ flexGrow: 1, padding: '10px', boxSizing: 'border-box', backgroundColor: '#2C2C2C', color: '#FFFFFF', border: '1px solid #4A4A4A', borderRadius: '6px' }}
                />
                <button
                    type="submit"
                    disabled={sending || newMessage.trim() === ''}
                    className="btn btn-primary"
                    style={{ width: 'auto', padding: '10px 15px' }}
                >
                    {sending ? '...' : 'Send'}
                </button>
            </form>
        </div>
    );
}