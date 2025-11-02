import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient'; 
import { FaUsers, FaDollarSign, FaRegCalendarAlt, FaUserCircle, FaComments } from 'react-icons/fa'; 

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
    backgroundColor: '#fff', 
    borderTop: '1px solid #ddd',
    padding: '10px 0 5px 0', 
    zIndex: 1000,
  };

  const linkStyle = (path) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    // Check if the current path *starts with* the link path for active state
    color: location.pathname.startsWith(path) ? '#39FF14' : '#757575', // Neon Green active
    fontSize: '0.75em', 
    fontWeight: location.pathname.startsWith(path) ? 'bold' : 'normal',
    padding: '0 5px',
    textAlign: 'center',
    width: '20%', 
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
        {/* UPDATED LINK */}
        <Link to="/resources" style={linkStyle('/resources')}> 
          <FaRegCalendarAlt style={iconStyle} /> 
          Resources 
        </Link>
        <Link to="/profile" style={linkStyle('/profile')}> 
          <FaUserCircle style={iconStyle} />
          Me
        </Link>
      </nav>
    </div>
  );
}