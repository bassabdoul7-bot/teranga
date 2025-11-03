import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Layout from './Layout';
import Profile from './Profile';
import Feed from './Feed';
import Rates from './Rates';
import ChatList from './ChatList';
import ChatRoom from './ChatRoom';
import Resources from './Resources';
import Directory from './Directory';
import Events from './Events';
import Notifications from './Notifications'; // --- ADDED THIS LINE ---
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (<div style={{ textAlign: 'center', marginTop: '50px', color: '#E0E0E0' }}>Loading session...</div>);
  }

  return (
    <BrowserRouter>
      <Routes>
        {!session ? (
          <>
            <Route path="/auth" element={
              <div style={{ maxWidth: '420px', margin: '50px auto' }}>
                <div style={{ backgroundColor: '#1E1E1E', padding: '25px' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#FFFFFF' }}>Welcome to TerangaHub ?</h2>
                  <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    theme="dark"
                    providers={['google', 'github']}
                  />
                </div>
              </div>
            } />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </>
        ) : (
          <Route path="/" element={<Layout setSession={setSession} />}>
            <Route index element={<Navigate to="/feed" replace />} />
            <Route path="feed" element={<Feed session={session} />} />
            <Route path="rates" element={<Rates session={session} />} />
            <Route path="chat" element={<ChatList session={session} />} />
            <Route path="chat/:conversationId" element={<ChatRoom session={session} />} />
            <Route path="resources" element={<Resources />} />
            <Route path="directory" element={<Directory session={session} />} />
            <Route path="events" element={<Events session={session} />} />
            
            {/* --- ADDED THIS LINE --- */}
            <Route path="notifications" element={<Notifications session={session} />} /> 

            <Route path="profile/:userId?" element={<Profile session={session} setSession={setSession} />} />
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;