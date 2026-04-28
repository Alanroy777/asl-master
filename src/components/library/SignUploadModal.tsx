'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { addLibrarySign } from '@/lib/supabase/libraryQueries'
import type { LibraryCategory, LibraryDifficulty } from '@/types/library'
import { supabase } from '@/lib/supabase/client'

interface SignUploadModalProps {
  onSuccess?: () => void
}

export function SignUploadModal({ onSuccess }: SignUploadModalProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState<LibraryCategory>('custom')
  const [difficulty, setDifficulty] = useState<LibraryDifficulty>('beginner')
  const [tags, setTags] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [source, setSource] = useState('custom')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const resetForm = () => {
    setName('')
    setCategory('custom')
    setDifficulty('beginner')
    setTags('')
    setVideoUrl('')
    setThumbnailUrl('')
    setSource('custom')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || (!videoUrl.trim() && !videoFile)) {
      toast.error('Name and Video (File or URL) are required')
      return
    }

    startTransition(async () => {
      let finalVideoUrl = videoUrl.trim()

      if (videoFile) {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          toast.error('Supabase URL and Anon Key are missing in .env')
          return
        }

        const fileExt = videoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

        setUploadProgress(10) // Small visual indicator

        const { data, error } = await supabase.storage
          .from('signs_library')
          .upload(filePath, videoFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          toast.error(`Upload failed: ${error.message}`)
          setUploadProgress(0)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('signs_library')
          .getPublicUrl(filePath)

        finalVideoUrl = publicUrl
        setUploadProgress(100)
      }
      const parsedTags = tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)

      const result = await addLibrarySign({
        name: name.trim(),
        category,
        videoUrl: finalVideoUrl,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        source: source.trim() || 'custom',
        difficulty,
        tags: parsedTags,
        createdById: undefined,
      })

      if (result.success) {
        toast.success('Sign added to library!')
        resetForm()
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isPending) { setOpen(v); if (!v) resetForm() } }}>
      <DialogTrigger asChild>
        <Button className="gap-2" id="add-sign-btn">
          <Plus className="h-4 w-4" />
          Add Sign
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Sign to Library</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Upload a new ASL sign to the centralized resource library.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5 py-2">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="lib-sign-name">Sign Name *</Label>
            <Input
              id="lib-sign-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='e.g. "Hello" or "Letter A"'
              disabled={isPending}
              required
              className="bg-zinc-900 border-zinc-700 focus:border-indigo-500"
            />
          </div>

          {/* Category + Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lib-sign-category">Category</Label>
              <Select value={category} onValueChange={v => setCategory(v as LibraryCategory)} disabled={isPending}>
                <SelectTrigger id="lib-sign-category" className="bg-zinc-900 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="alphabet">Alphabet</SelectItem>
                  <SelectItem value="numbers">Numbers</SelectItem>
                  <SelectItem value="greetings">Greetings</SelectItem>
                  <SelectItem value="common_words">Common Words</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lib-sign-difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={v => setDifficulty(v as LibraryDifficulty)} disabled={isPending}>
                <SelectTrigger id="lib-sign-difficulty" className="bg-zinc-900 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="grid gap-2">
            <Label htmlFor="lib-sign-tags">Tags <span className="text-zinc-500 text-xs">(comma-separated)</span></Label>
            <Input
              id="lib-sign-tags"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="greeting, basic, a-z"
              disabled={isPending}
              className="bg-zinc-900 border-zinc-700"
            />
          </div>

          {/* Video Upload / URL */}
          <div className="grid gap-2">
            <Label>Video *</Label>
            <div className="flex flex-col gap-3">
              {/* File Upload Option */}
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('lib-sign-video-file')?.click()}
                  className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                  disabled={isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {videoFile ? 'Change File' : 'Upload MP4'}
                </Button>
                <span className="text-sm text-zinc-400 truncate max-w-[200px]">
                  {videoFile ? videoFile.name : 'No file selected'}
                </span>
                <input 
                  id="lib-sign-video-file" 
                  type="file" 
                  accept="video/mp4,video/webm" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setVideoFile(file)
                      setVideoUrl('') // Clear URL if file is selected
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-px bg-zinc-800 flex-1"></div>
                <span className="text-xs text-zinc-500 uppercase">OR PASTE URL</span>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>

              {/* URL Option */}
              <Input
                id="lib-sign-video"
                value={videoUrl}
                onChange={e => {
                  setVideoUrl(e.target.value)
                  if (e.target.value) setVideoFile(null) // Clear file if URL is typed
                }}
                placeholder="https://... (Supabase storage or CDN URL)"
                disabled={isPending || !!videoFile}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <p className="text-xs text-indigo-400 mt-1">Uploading video... Please wait.</p>
            )}
            <p className="text-xs text-zinc-500 mt-1">Upload a video file (MP4/WebM) or provide a direct public URL.</p>
          </div>

          {/* Thumbnail URL */}
          <div className="grid gap-2">
            <Label htmlFor="lib-sign-thumbnail">Thumbnail URL <span className="text-zinc-500 text-xs">(optional)</span></Label>
            <Input
              id="lib-sign-thumbnail"
              value={thumbnailUrl}
              onChange={e => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
              disabled={isPending}
              className="bg-zinc-900 border-zinc-700"
            />
          </div>

          {/* Source */}
          <div className="grid gap-2">
            <Label htmlFor="lib-sign-source">Source</Label>
            <Input
              id="lib-sign-source"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="WLASL / ASL-LEX / custom"
              disabled={isPending}
              className="bg-zinc-900 border-zinc-700"
            />
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-500">
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add to Library
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
