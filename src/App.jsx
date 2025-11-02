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
// IMPORT RENAMED/NEW COMPONENTS
import Resources from './Resources';   // The new hub
import Directory from './Directory';   // Renamed from DirectoryPlaceholder
import Events from './Events';       // Renamed from EventsPlaceholder
import AddStory from './AddStory'; // --- NEWLY ADDED ---
import StoryViewer from './StoryViewer'; // --- NEWLY ADDED ---
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
        {/* If NO session, show Auth */}
        {!session ? (
          <>
            <Route path="/auth" element={ 
              <div style={{ maxWidth: '420px', margin: '50px auto' }}> 
                <div style={{ backgroundColor: '#1E1E1E', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#FFFFFF' }}>Welcome to TerangaHub ✨</h2> 
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
          /* If session EXISTS, render Layout and nested routes */
          <Route path="/" element={<Layout setSession={setSession} />}> 
            <Route index element={<Navigate to="/feed" replace />} /> 
            <Route path="feed" element={<Feed session={session} />} /> 
            <Route path="rates" element={<Rates session={session} />} /> 
            <Route path="chat" element={<ChatList session={session} />} /> 
            <Route path="chat/:conversationId" element={<ChatRoom session={session} />} /> 

            {/* UPDATED RESOURCES ROUTES */}
            <Route path="resources" element={<Resources />} /> {/* Main Hub */}
            <Route path="directory" element={<Directory session={session} />} /> {/* Specific Page */}
            <Route path="events" element={<Events session={session} />} /> {/* Specific Page */}

            {/* --- NEW STORY ROUTES --- */}
            <Route path="stories/upload" element={<AddStory session={session} />} />
            <Route path="stories/:userId" element={<StoryViewer />} />

            <Route path="profile/:userId?" element={<Profile session={session} setSession={setSession} />} /> 
            <Route path="*" element={<Navigate to="/feed" replace />} /> 
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;