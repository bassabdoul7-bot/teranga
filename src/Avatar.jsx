import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { FaUserCircle } from 'react-icons/fa'; // Placeholder icon

export default function Avatar({ url, size, onUpload, userId }) {
  const [uploading, setUploading] = useState(false);

  // NOTE: We no longer need the 'downloadImage' function or the 'useEffect'
  // The 'url' prop will now be the full, public URL and can be used directly.

  // Handle the file upload event
  async function uploadAvatar(event) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      if (!userId) { // Check that userId was passed
        throw new Error('User not identified, cannot upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`; 

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // --- THIS IS THE FIX ---
      // Get the public URL *after* upload
      const { data: publicURLData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      if (!publicURLData || !publicURLData.publicUrl) {
          throw new Error("Could not get public URL for avatar.");
      }

      // Pass the full public URL (not the path) back to the Profile component
      onUpload(publicURLData.publicUrl); 

    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  // --- Render Logic ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      {url ? ( // Use the 'url' prop directly
        <img
          src={url} // This is now the full public URL from the database
          alt="Avatar"
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        // Placeholder if no image
        <FaUserCircle style={{ fontSize: size, color: '#4A4A4A' }} />
      )}

      {/* Upload Button/Label (Only show if onUpload function is provided) */}
      {onUpload && (
        <div>
          <label 
            htmlFor="avatar-upload" 
            className="btn btn-muted" 
            style={{ width: 'auto', padding: '8px 12px', cursor: 'pointer' }}
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/png, image/jpeg"
            onChange={uploadAvatar}
            disabled={uploading}
            style={{ display: 'none' }} // Hide the actual file input
          />
        </div>
      )}
    </div>
  );
}