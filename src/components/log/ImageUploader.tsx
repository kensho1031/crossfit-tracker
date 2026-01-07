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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <label
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '1rem',
                    border: '2px dashed var(--color-border)',
                    cursor: 'pointer',
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--color-text-muted)'
                }}
            >
                {uploading ? <Loader2 className="spin" /> : <ImagePlus />}
                <span>{uploading ? 'Uploading...' : 'Take Photo / Upload WOD'}</span>
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
