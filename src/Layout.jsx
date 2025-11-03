import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
// --- ADDED FaBell ---
import { FaUsers, FaDollarSign, FaRegCalendarAlt, FaUserCircle, FaComments, FaBell } from 'react-icons/fa';

export default function Layout({ setSession }) {
  const location = useLocation();

  const navStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#121a2a', // --- CHANGED: Matched to index.css
    borderTop: '1px solid #1a3a4a', // --- CHANGED: Matched to index.css
    padding: '10px 0 5px 0',
    zIndex: 1000,
  };

  const linkStyle = (path) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    // --- CHANGED: Active color now matches your 'A6D1E6' brand color ---
    color: location.pathname.startsWith(path) ? '#A6D1E6' : '#757575',
    fontSize: '0.75em',
    fontWeight: location.pathname.startsWith(path) ? 'bold' : 'normal',
    padding: '0 5px',
    textAlign: 'center',
    flex: 1, // --- CHANGED: Replaced 'width' to auto-space 6 items ---
  });

  const iconStyle = {
      fontSize: '1.4em',
      marginBottom: '3px',
  };

  return (
    <div style={{ paddingBottom: '70px', maxWidth: '600px', margin: '0 auto', boxSizing: 'border-box' }}>
      <Outlet />
      <nav style={navStyle}>
        <Link to="/feed" style={linkStyle('/feed')}>
          <FaUsers style={iconStyle} />
          Community
        </Link>
        <Link to="/rates" style={linkStyle('/rates')}>
          <FaDollarSign style={iconStyle} />
          Send Money
        </Link>
        <Link to="/chat" style={linkStyle('/chat')}>
          <FaComments style={iconStyle} />
          Chat
        </Link>
        <Link to="/resources" style={linkStyle('/resources')}>
          <FaRegCalendarAlt style={iconStyle} />
          Resources
        </Link>

        {/* --- ADDED: New Notifications Link --- */}
        <Link to="/notifications" style={linkStyle('/notifications')}>
          <FaBell style={iconStyle} />
          Notifications
        </Link>

        <Link to="/profile" style={linkStyle('/profile')}>
          <FaUserCircle style={iconStyle} />
          Me
        </Link>
      </nav>
    </div>
  );
}