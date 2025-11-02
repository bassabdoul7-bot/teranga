import { useState } from 'react';
import { supabase } from './supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { FaImage } from 'react-icons/fa';

export default function AddStory({ session }) {
    const [mediaFile, setMediaFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [mediaType, setMediaType] = useState('image');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setMediaFile(null);
            setPreviewUrl(null);
            return;
        }

        setMediaFile(file);
        setMediaType(file.type.startsWith('video') ? 'video' : 'image');
        setPreviewUrl(URL.createObjectURL(file)); // Create a temporary local URL for preview
    };

    const handleUpload = async () => {
        if (!mediaFile) return;

        setLoading(true);

        // 1. Upload to Storage
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('stories') // Use the 'stories' bucket
            .upload(fileName, mediaFile);

        if (uploadError) {
            alert('Error uploading story: ' + uploadError.message);
            setLoading(false);
            return;
        }

        // 2. Get Public URL
        const { data: publicURLData } = supabase.storage
            .from('stories')
            .getPublicUrl(fileName);
        
        const media_url = publicURLData.publicUrl;

        // 3. Insert into Database Table
        const { error: insertError } = await supabase.from('stories').insert({
            user_id: session.user.id,
            media_url: media_url,
            media_type: mediaType
        });

        if (insertError) {
            alert('Error saving story: ' + insertError.message);
        } else {
            alert('Story uploaded!');
            navigate('/feed'); // Go back to the feed
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '15px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
                <Link to="/feed" className="btn btn-muted" style={{ width: 'auto', padding: '8px 12px', marginRight: 'auto', textDecoration: 'none' }}>
                    &larr; Back
                </Link>
                <h2 style={{ margin: '0 auto 0 auto', color: '#FFFFFF', textAlign: 'center' }}>
                    Add Your Story
                </h2>
                <div style={{width: '60px'}}></div> {/* Spacer */}
            </div>

            {/* Uploader Card */}
            <div style={{ backgroundColor: '#1E1E1E', padding: '25px', borderRadius: '12px' }}>
                
                {/* Media Preview */}
                {previewUrl ? (
                    <div style={{ marginBottom: '20px' }}>
                        {mediaType === 'image' ? (
                            <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '400px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (
                            <video src={previewUrl} controls style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }} />
                        )}
                    </div>
                ) : (
                    <div style={{ height: '300px', border: '2px dashed #4A4A4A', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#757575', marginBottom: '20px' }}>
                        <FaImage style={{ fontSize: '50px', marginBottom: '10px' }} />
                        <p>Select a photo or video to preview</p>
                    </div>
                )}
                
                {/* File Input */}
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="story-upload" className="btn btn-secondary" style={{ width: '100%', textDecoration: 'none' }}>
                        {mediaFile ? `Selected: ${mediaFile.name}` : 'Choose Photo/Video'}
                    </label>
                    <input 
                        id="story-upload" 
                        type="file" 
                        accept="image/png, image/jpeg, video/mp4, video/quicktime" 
                        onChange={handleFileChange} 
                        disabled={loading} 
                        style={{ display: 'none' }} 
                    />
                </div>

                {/* Upload Button */}
                <button 
                    onClick={handleUpload} 
                    disabled={!mediaFile || loading} 
                    className="btn btn-primary" 
                    style={{ width: '100%' }}
                >
                    {loading ? 'Uploading...' : 'Post Story'}
                </button>
            </div>
        </div>
    );
}