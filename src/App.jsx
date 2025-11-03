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
import Resources from './Resources';   // The new hub
import Directory from './Directory';   // Renamed from DirectoryPlaceholder
import Events from './Events';       // Renamed from EventsPlaceholder
import './App.css';

// --- PUSH NOTIFICATIONS ---
const VAPID_PUBLIC_KEY = 'BMZtsjLVAlMgYB235iT7OoA2sJL7fUhGXa9flptCnGVcLosNjg6xKwtA-LEAN_Tdw_zbukNTqp0gIiHteOiu8Gc';

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper function to register for push
async function registerPushNotifications(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported by this browser.');
    return;
  }

  try {
    // Wait for the service worker to be ready
    const registration = await navigator.serviceWorker.ready;
    console.log('Service Worker is ready.');

    // Check if a subscription already exists
    let subscription = await registration.pushManager.getSubscription();

    if (subscription === null) {
      // No subscription exists, so create a new one
      console.log('No subscription found, requesting permission...');
      
      // Request permission from the user
      const permission = await window.Notification.requestPermission();

      if (permission !== 'granted') {
        console.warn('Permission for notifications was denied.');
        return;
      }

      console.log('Permission granted, creating subscription...');
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      // Subscribe the user
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
    }

    // --- THIS BLOCK IS NEW ---
    // Save the subscription to Supabase
    console.log('Saving subscription to database...');
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ 
        user_id: userId, 
        subscription: subscription 
      });

    if (error) {
      console.error('Error saving push subscription:', error);
    } else {
      console.log('Push subscription saved successfully.');
    }
    // --- END OF NEW BLOCK ---

  } catch (error) {
    console.error('Error during push notification registration:', error);
  }
}
// --- END OF PUSH NOTIFICATION CODE ---


function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        // If session exists on load, register for push
        console.log('Session found on load, registering for push...');
        registerPushNotifications(session.user.id);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // 2. Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN') {
        // If user just signed in, register for push
        console.log('User signed in, registering for push...');
        registerPushNotifications(session.user.id);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (<div style={{ textAlign: 'center', marginTop: '50px', color: '#E0E0E0' }}>Loading session...</div>);
a }

  return (
    <BrowserRouter>
      <Routes>
        {!session ? (
          <>
            <Route path="/auth" element={
              <div style={{ maxWidth: '420px', margin: '50px auto' }}>
                <div style={{ backgroundColor: '#1E1E1E', padding: '25px' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#FFFFFF' }}>Welcome to TerangaHub ?</h2>
                . <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    theme="dark"
                    providers={['google', 'github']}
I                 />
                </div>
              </div>
            } />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </>
        ) : (
          <Route path="/" element={<Layout setSession={setSession} />}>
            <Route index element={<Navigate to="/feed" replace />} />
  Two         <Route path="feed" element={<Feed session={session} />} />
            <Route path="rates" element={<Rates session={session} />} />
            <Route path="chat" element={<ChatList session={session} />} />
A           <Route path="chat/:conversationId" element={<ChatRoom session={session} />} />
            <Route path="resources" element={<Resources />} />
            <Route path="directory" element={<Directory session={session} />} />
            <Route path="events" element={<Events session={session} />} />
            <Route path="profile/:userId?" element={<Profile session={session} setSession={setSession} />} />
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;