import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaComment, FaHeart } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

// This component will render a single notification item
function NotificationItem({ notification }) {
  // Get the profile info of the "actor" (the person who did the action)
  const actor = notification.actor_user_id;
  const actorName = actor ? actor.username || actor.full_name : 'Someone';
  const avatarUrl = actor ? actor.avatar_url : null;

  let message = '';
  let icon = <FaUserCircle />;

  // Create the notification message based on its type
  switch (notification.type) {
    case 'comment':
      message = 'commented on your post';
      icon = <FaComment style={{ color: '#A6D1E6' }} />;
      break;
    case 'like':
      message = 'liked your post';
      icon = <FaHeart style={{ color: '#FF6B6B' }} />;
      break;
    case 'follow':
      message = 'started following you';
      icon = <FaUserCircle style={{ color: '#39FF14' }} />;
      break;
    default:
      message = 'sent you a notification';
  }

  // Format the timestamp
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  return (
    // Link to the specific post (if it's a comment/like) or the actor's profile
    <Link
      to={notification.post_id ? `/feed` : `/profile/${actor.id}`} // Simple link to feed for now
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '15px',
        borderBottom: '1px solid #1a3a4a',
        textDecoration: 'none',
        color: 'inherit',
        backgroundColor: notification.is_read ? 'transparent' : 'rgba(166, 209, 230, 0.05)', // Slight glow if unread
      }}
    >
      {/* Avatar or Icon */}
      <div style={{ marginRight: '15px', flexShrink: 0 }}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={actorName}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{ fontSize: '24px' }}>{icon}</span>
        )}
      </div>

      {/* Message and Timestamp */}
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, color: '#E0E0E0', fontSize: '0.9em' }}>
          <strong style={{ color: '#FFFFFF' }}>{actorName}</strong> {message}
        </p>
        <p style={{ margin: '4px 0 0 0', color: '#757575', fontSize: '0.8em' }}>
          {timeAgo}
        </p>
      </div>
    </Link>
  );
}

// This is the main page component
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      
      // Fetch notifications AND the profile of the person who acted
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          created_at,
          type,
          is_read,
          post_id,
          actor_user_id ( id, username, full_name, avatar_url )
        `)
        .order('created_at', { ascending: false }); // Show newest first

      if (error) {
        console.error('Error fetching notifications:', error);
      } else if (data) {
        setNotifications(data);
      }
      setLoading(false);
    }

    fetchNotifications();
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', color: 'white' }}>
      <header style={{
        padding: '20px 15px',
        borderBottom: '1px solid #1a3a4a',
        backgroundColor: '#0A0A0F', // Match body
        position: 'sticky',
        top: 0,
        zIndex: 900
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5em' }}>Notifications</h1>
      </header>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Loading...</p>
      ) : notifications.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '20px', color: '#757575' }}>
          You have no new notifications.
        </p>
      ) : (
        <div>
          {notifications.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} />
          ))}
        </div>
      )}
    </div>
  );
}