import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import { FaStore, FaGlobe, FaPhone, FaMapMarkerAlt, FaBuilding, FaUser } from 'react-icons/fa';

// This is the card for a single business
function BusinessCard({ business }) {
    const cardStyle = {
        backgroundColor: '#1E1E1E',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    };
    const titleStyle = {
        color: '#39FF14', // Neon Green
        fontSize: '1.4em',
        margin: '0 0 10px 0',
    };
    const textStyle = {
        color: '#E0E0E0',
        margin: '5px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    };
    const linkStyle = {
        ...textStyle,
        color: '#4DAFFF', // Bright Link Blue
        textDecoration: 'none',
    };

    return (
        <div style={cardStyle}>
            <h3 style={titleStyle}>{business.name}</h3>
            {business.category && (
                <p style={textStyle}><FaBuilding /> {business.category}</p>
            )}
            <p style={textStyle}>{business.description}</p>
            {business.address && (
                <p style={textStyle}><FaMapMarkerAlt /> {business.address}</p>
            )}
            {business.phone && (
                <p style={textStyle}><FaPhone /> {business.phone}</p>
            )}
            {business.website && (
                <a href={business.website} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                    <FaGlobe /> {business.website}
                </a>
            )}
            {/* Optional: Link to the owner's profile page */}
            {/* <Link to={/profile/} style={{...linkStyle, marginTop: '10px'}}>
                <FaUser /> View Owner Profile
            </Link> */}
        </div>
    );
}

// This is the main page component
export default function Directory() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBusinesses() {
            setLoading(true);
            const { data, error } = await supabase
                .from('businesses')
                .select('*') // Fetches all columns for all businesses
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching businesses:', error);
                alert('Could not fetch businesses.');
            } else {
                setBusinesses(data || []);
            }
            setLoading(false);
        }

        fetchBusinesses();
    }, []);

    return (
        <div style={{ maxWidth: '600px', margin: '30px auto', padding: '15px' }}>
            
            {/* Header Area */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
                <Link to="/resources" className="btn btn-muted" style={{ width: 'auto', padding: '8px 12px', marginRight: 'auto' }}>
                     Back to Resources
                </Link>
                <h2 style={{ margin: '0 auto 0 auto', color: '#FFFFFF', textAlign: 'center' }}>
                    Community Directory
                </h2>
                <div style={{width: '120px'}}></div> {/* Spacer */}
            </div>

            {/* --- NEW: Add Business Button Card --- */}
            <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#1E1E1E', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <p style={{ color: '#E0E0E0', margin: '0 0 15px 0', fontSize: '1.1em' }}>Do you own a business?</p>
                <p style={{ color: '#BDBDBD', margin: '0 0 20px 0', fontSize: '0.9em' }}>List it here for the whole community to see!</p>
                <Link to="/profile" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                    Register My Business
                </Link>
            </div>
            {/* --- END NEW BUTTON --- */}


            {/* Business List */}
            <div>
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#BDBDBD' }}>Loading businesses...</p>
                ) : businesses.length === 0 ? (
                    <>
                        <p style={{ textAlign: 'center', color: '#BDBDBD', padding: '20px 0' }}>No businesses have been registered yet.</p>
                        <p style={{ textAlign: 'center', color: '#BDBDBD' }}>Be the first!</p>
                    </>
                ) : (
                    businesses.map(business => (
                        <BusinessCard key={business.id} business={business} />
                    ))
                )}
            </div>

        </div>
    );
}
