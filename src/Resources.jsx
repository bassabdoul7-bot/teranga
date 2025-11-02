import React from 'react';
import { Link } from 'react-router-dom';
import { FaStore, FaCalendarAlt } from 'react-icons/fa'; // Import icons

// This is the new hub component for the "Resources" tab

export default function Resources() {
  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '30px 20px',
    backgroundColor: '#1E1E1E',
    borderRadius: '12px',
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s ease',
  };

  const iconStyle = {
    fontSize: '2.5em',
    color: '#A6D1E6', // --- CHANGED TO NEW THEME COLOR ---
    marginRight: '20px',
  };

  const textContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
  };

  const titleStyle = {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: '1.2em',
    margin: 0,
  };

  const descriptionStyle = {
    color: '#BDBDBD',
    fontSize: '0.9em',
    margin: '3px 0 0 0',
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '15px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #4A4A4A' }}>
        <h1 style={{ color: '#E0E0E0', margin: 0, fontSize: '1.5em' }}>Resources</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>

        {/* Link to Directory */}
        <Link to="/directory" style={linkStyle}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'none'}>
          <FaStore style={iconStyle} />
          <div style={textContainerStyle}>
            <span style={titleStyle}>Community Directory</span>
            <span style={descriptionStyle}>Find Senegalese-owned businesses.</span>
          </div>
        </Link>

        {/* Link to Events */}
        <Link to="/events" style={linkStyle}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'none'}>
          <FaCalendarAlt style={iconStyle} />
          <div style={textContainerStyle}>
            <span style={titleStyle}>Community Events</span>
            <span style={descriptionStyle}>See what's happening.</span>
          </div>
        </Link>

      </div>
    </div>
  );
}