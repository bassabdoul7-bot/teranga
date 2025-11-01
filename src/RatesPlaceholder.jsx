import React from 'react';
import { Link } from 'react-router-dom'; // Import Link

export default function RatesPlaceholder() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Remittance Rates</h2>
      <p>(Rate comparison tool will be built here)</p>
       {/* Removed RemittanceTool import - use Link instead */}
      <Link to=""/feed"" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 15px', backgroundColor: '#E6A800', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
         Back to Feed
      </Link>
    </div>
  );
}
