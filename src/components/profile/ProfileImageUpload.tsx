
'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, User } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { updateProfileImage } from '@/app/lib/actions'
import { toast } from 'sonner'
import Image from 'next/image'

interface ProfileImageUploadProps {
    currentImage?: string | null
}

export function ProfileImageUpload({ currentImage }: ProfileImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(currentImage || null)
    const [error, setError] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        console.log('Selected file:', file.name, file.size, file.type)

        // 1. Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file.')
            return
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            toast.error('Image must be less than 2MB.')
            return
        }

        try {
            setUploading(true)
            setError(false)

            // 2. Create preview
            const objectUrl = URL.createObjectURL(file)
            setPreview(objectUrl)

            // 3. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `avatar_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            console.log('Uploading to Supabase path:', filePath)

            const { error: uploadError, data } = await supabase.storage
                .from('signs_library')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                console.error('Supabase upload error:', uploadError)
                throw uploadError
            }

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('signs_library')
                .getPublicUrl(filePath)

            console.log('Generated Public URL:', publicUrl)

            // 5. Update Database
            const result = await updateProfileImage(publicUrl)

            if (result.success) {
                toast.success('Profile picture updated!')
            } else {
                throw new Error(result.message || 'Database update failed')
            }

        } catch (error: any) {
            console.error('Final upload process error:', error)
            toast.error(error.message || 'Failed to upload image. Check console for details.')
            setPreview(currentImage || null)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-background bg-secondary overflow-hidden relative shadow-2xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-indigo-500/20">
                {preview && !error ? (
                    <Image 
                        src={preview} 
                        alt="Profile" 
                        fill 
                        className="object-cover"
                        unoptimized
                        onError={() => {
                            setError(true)
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-secondary text-muted-foreground gap-2">
                        <User className="h-12 w-12 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">No Photo</span>
                    </div>
                )}

                {/* Loading Overlay */}
                {uploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-md">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                )}
            </div>

            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={uploading}
            />
            
            {/* Corner Badge - Positioned better and ensures it's on top */}
            <div className="absolute bottom-1 right-1 w-10 h-10 bg-background border-2 border-primary/20 rounded-2xl flex items-center justify-center shadow-xl group-hover:bg-primary group-hover:scale-110 transition-all duration-300 z-10">
                <Camera className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
            </div>
        </div>
    )
}
