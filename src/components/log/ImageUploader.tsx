import { useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
    onUploadSuccess: (url: string) => void;
}

export function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'crossfit'); // User provided preset name

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/dz1niu6hp/image/upload`, // User provided cloud name
                {
                    method: 'POST',
                    body: formData,
                }
            );
            const data = await response.json();

            if (data.secure_url) {
                onUploadSuccess(data.secure_url);
            } else {
                alert('Upload failed: ' + (data.error?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Upload failed. Please check your connection.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <label
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 255, 255, 0.05) 100%)',
                    border: '2px solid var(--color-neon)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    width: '100%',
                    boxSizing: 'border-box',
                    color: 'var(--color-neon)',
                    fontWeight: 700,
                    boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap'
                }}
            >
                {uploading ? <Loader2 className="spin" /> : <ImagePlus size={24} />}
                <span style={{ fontSize: '1rem' }}>{uploading ? 'アップロード中...' : '写真を撮影 / アップロード'}</span>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            </label>
        </div>
    );
}
