import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom'; // Keep Link for later
import { FaCalendarAlt } from 'react-icons/fa'; // Icon for events

// --- Main Events Component ---
export default function Events({ session }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            setLoading(true);
            const now = new Date().toISOString(); // Get current time

            // Fetch all events occurring after the current time
            const { data, error } = await supabase
                .from('events')
                .select('id, event_name, event_date, description, location')
                .gte('event_date', now) // Only get upcoming events
                .order('event_date', { ascending: true }); // Show soonest first

            if (error) {
                console.error('Error fetching events:', error);
            } else {
                setEvents(data || []);
            }
            setLoading(false);
        }

        fetchEvents();
    }, []); // Fetch only once on component mount

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '15px' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #4A4A4A' }}>
                <h1 style={{ color: '#E0E0E0', margin: 0, fontSize: '1.5em' }}>Community Events</h1>
            </header>
            
            {/* We can add an "Add Event" button here later */}
            {/* <button className="btn btn-secondary" style={{width: '100%', marginBottom: '20px'}}>+ Add New Event</button> */}

            {/* Events List Section */}
            <div>
                {loading ? (
                    <p style={{ color: '#A0AEC0', textAlign: 'center' }}>Loading events...</p>
                ) : events.length === 0 ? (
                    <p style={{ color: '#A0AEC0', textAlign: 'center' }}>No upcoming events scheduled.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {events.map(event => (
                            <div key={event.id} style={{ padding: '15px', backgroundColor: '#1E1E1E', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                <h3 style={{ margin: '0 0 5px 0', color: '#8AFF8A', display: 'flex', alignItems: 'center' }}>
                                    <FaCalendarAlt style={{ marginRight: '8px' }} />
                                    {event.event_name}
                                </h3>
                                <p style={{ margin: '0 0 10px 0', fontSize: '0.9em', color: '#BDBDBD', fontStyle: 'italic' }}>
                                    {/* Format the date nicely */}
                                    {new Date(event.event_date).toLocaleString(undefined, { 
                                        dateStyle: 'full', 
                                        timeStyle: 'short' 
                                    })}
                                </p>
                                <p style={{ margin: '0 0 10px 0', color: '#E0E0E0' }}>{event.description}</p>
                                
                                {event.location && <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#BDBDBD' }}>📍 {event.location}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}