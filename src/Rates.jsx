import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';

// --- SIMULATED DUMMY DATA (REPLACE WITH LIVE API DATA LATER) ---
const DUMMY_RATES_DATA = [
    { id: 'wise', name: 'Wise', rate: 605.50, fee: 3.99, delivery: 'Within 2 hours', link: 'https://wise.com/' },
    { id: 'remitly', name: 'Remitly', rate: 603.20, fee: 0.00, delivery: 'In minutes (Express)', link: 'https://remitly.com/' },
    { id: 'taptap', name: 'Taptap Send', rate: 606.10, fee: 2.50, delivery: 'Instant to mobile money', link: 'https://taptapsend.com/' },
    { id: 'ria', name: 'Ria', rate: 599.00, fee: 4.00, delivery: 'Cash pickup in 15 mins', link: 'https://ria.com/' },
];

// Simulate fetching service rates
const fetchSimulatedRates = (amount) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const calculatedRates = DUMMY_RATES_DATA.map(service => {
                const recipientGets = (amount * service.rate) - (service.fee * service.rate);
                return { ...service, recipientGets };
            });
            const sortedRates = calculatedRates.sort((a, b) => b.recipientGets - a.recipientGets);
            resolve(sortedRates);
        }, 1000); // 1 second delay
    });
};

// --- NEW: Simulate fetching the mid-market rate ---
const fetchSimulatedMidMarketRate = () => {
    return new Promise((resolve) => {
        // This rate should be slightly better than any service
        setTimeout(() => {
            resolve(607.25);
        }, 700); // Shorter delay
    });
};


// --- Main Rates Component ---
export default function Rates({ session }) {
    const [sendAmount, setSendAmount] = useState(100.00);
    const [loading, setLoading] = useState(true);
    const [rates, setRates] = useState([]);
    const [midMarketRate, setMidMarketRate] = useState(null); // New state for mid-market rate

    useEffect(() => {
        setLoading(true);
        // Fetch both service rates and mid-market rate
        Promise.all([
            fetchSimulatedRates(sendAmount),
            fetchSimulatedMidMarketRate()
        ]).then(([serviceRates, midRate]) => {
            setRates(serviceRates);
            setMidMarketRate(midRate);
            setLoading(false);
        });
    }, [sendAmount]); // Re-fetch if sendAmount changes

    const handleSendClick = (service) => {
        alert(`Redirecting to ${service.name}... Your affiliate link would go here.`);
        // window.open(service.link, '_blank');
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '15px' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #4A4A4A' }}>
                <h1 style={{ color: '#E0E0E0', margin: 0, fontSize: '1.5em' }}>Send Money</h1>
            </header>

            {/* --- NEW: Mid-Market Rate Display --- */}
            <div style={{ textAlign: 'center', margin: '-10px 0 20px 0', padding: '5px', backgroundColor: '#1E1E1E', borderRadius: '6px' }}>
                {loading || !midMarketRate ? (
                    <p style={{ color: '#757575', fontSize: '0.9em', margin: 0 }}>Fetching mid-market rate...</p>
                ) : (
                    <p style={{ color: '#BDBDBD', fontSize: '0.9em', fontStyle: 'italic', margin: 0 }}>
                        Live Mid-Market Rate: <strong>$1 = {midMarketRate.toFixed(2)} XOF</strong>
                    </p>
                )}
            </div>
            {/* --- End New Display --- */}


            {/* 1. Input Section */}
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#1E1E1E', borderRadius: '12px' }}>
                <label htmlFor="sendAmount" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#BDBDBD' }}>
                    You Send (USD)
                </label>
                <input
                    id="sendAmount"
                    type="number"
                    step="10"
                    min="1"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '12px', fontSize: '1.2em', border: '1px solid #4A4A4A', borderRadius: '6px', boxSizing: 'border-box', backgroundColor: '#2C2C2C', color: '#FFFFFF' }}
                />
            </div>

            {/* 2. Comparison Results */}
            <h2 style={{ color: '#E0E0E0', margin: '30px 0 10px 0', borderBottom: '1px solid #4A4A4A', paddingBottom: '5px' }}>Comparison Results</h2>

            {loading ? (
                <p style={{ color: '#A0AEC0', textAlign: 'center' }}>Fetching best rates...</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {rates.map((service, index) => {
                        
                        const isBestRate = index === 0;
                        const accentBlue = '#A6D1E6'; // Our new light blue
                        
                        // Base style for all buttons
                        const buttonStyle = {
                            width: '100%',
                            padding: '10px 0',
                            fontWeight: 'bold',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1em'
                        };
                        
                        // If it's NOT the best rate, apply secondary styles
                        if (!isBestRate) {
                            buttonStyle.background = 'transparent';
                            buttonStyle.color = accentBlue;
                            buttonStyle.border = `1px solid ${accentBlue}`;
                        }

                        return (
                            <div
                                key={service.id}
                                style={{
                                    padding: '15px',
                                    border: isBestRate ? `2px solid ${accentBlue}` : '1px solid #4A4A4A',
                                    borderRadius: '8px',
                                    backgroundColor: '#1E1E1E'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h3 style={{ margin: 0, color: '#FFFFFF' }}>{service.name}</h3>
                                    {isBestRate && <span style={{ backgroundColor: accentBlue, padding: '3px 8px', borderRadius: '4px', color: '#121212', fontSize: '0.9em', fontWeight: 'bold' }}>BEST RATE</span>}
                                </div>

                                <p style={{ margin: '0 0 5px 0', color: '#BDBDBD' }}>Rate: 1 USD = {service.rate.toFixed(2)} XOF</p>
                                <p style={{ margin: '0 0 15px 0', color: '#BDBDBD' }}>Fee: {service.fee === 0.00 ? 'Free' : `$${service.fee.toFixed(2)}`}</p>

                                <h4 style={{ margin: '0 0 15px 0', color: '#A6D1E6' }}>
                                    Recipient Gets: {service.recipientGets.toLocaleString('en-US', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </h4>

                                <button
                                    onClick={() => handleSendClick(service)}
                                    className={isBestRate ? "btn btn-primary" : "btn"}
                                    style={buttonStyle}
                                >
                                    Send with {service.name}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            <p style={{ textAlign: 'center', fontSize: '0.8em', marginTop: '20px', color: '#757575' }}>
                Rates are estimates. Final rates are set by the provider.
            </p>
        </div>
    );
}