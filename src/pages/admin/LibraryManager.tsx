'use client'

import { useState, useTransition, useCallback } from 'react'
import { LibrarySignCard } from '@/components/library/SignCard'
import { SignUploadModal } from '@/components/library/SignUploadModal'
import { SignBlueprintCapture } from '@/components/library/SignBlueprintCapture'
import { BulkImportPanel } from '@/components/library/BulkImportPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Search,
  Library,
  Upload,
  Trash2,
  Edit3,
  Loader2,
  X,
  FileJson,
  LayoutGrid,
  AlertTriangle,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { deleteLibrarySign, updateLibrarySign, clearLibrarySigns } from '@/lib/supabase/libraryQueries'
import { useDebounce } from 'use-debounce'
import type { SignLibraryEntry, LibraryCategory, LibraryDifficulty } from '@/types/library'
import { supabase } from '@/lib/supabase/client'

const CATEGORY_OPTIONS = ['all', 'alphabet', 'numbers', 'greetings', 'common_words', 'custom'] as const
const DIFFICULTY_OPTIONS = ['all', 'beginner', 'intermediate', 'advanced'] as const

interface LibraryManagerClientProps {
  initialSigns: SignLibraryEntry[]
}

export function LibraryManagerClient({ initialSigns }: LibraryManagerClientProps) {
  const [signs, setSigns] = useState<SignLibraryEntry[]>(initialSigns)
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 250)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Edit modal state
  const [editingSign, setEditingSign] = useState<SignLibraryEntry | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState<LibraryCategory>('custom')
  const [editDifficulty, setEditDifficulty] = useState<LibraryDifficulty>('beginner')
  const [editTags, setEditTags] = useState('')
  const [editSource, setEditSource] = useState('')
  const [editVideoUrl, setEditVideoUrl] = useState('')
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null)
  const [editUploadProgress, setEditUploadProgress] = useState(0)
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('')

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Blueprint state
  const [blueprintingSign, setBlueprintingSign] = useState<SignLibraryEntry | null>(null)

  // Preview state
  const [previewSign, setPreviewSign] = useState<SignLibraryEntry | null>(null)

  const filtered = signs.filter(s => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false
    if (difficultyFilter !== 'all' && s.difficulty !== difficultyFilter) return false
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      if (!s.name.toLowerCase().includes(q) && !s.tags.some(t => t.toLowerCase().includes(q))) return false
    }
    return true
  })

  const refreshSigns = (newSigns: SignLibraryEntry[]) => setSigns(newSigns)

  const openEditModal = (sign: SignLibraryEntry) => {
    setEditingSign(sign)
    setEditName(sign.name)
    setEditCategory(sign.category)
    setEditDifficulty(sign.difficulty)
    setEditTags(sign.tags.join(', '))
    setEditSource(sign.source)
    setEditVideoUrl(sign.videoUrl)
    setEditThumbnailUrl(sign.thumbnailUrl || '')
    setEditVideoFile(null)
    setEditUploadProgress(0)
  }

  const handleEditSave = () => {
    if (!editingSign) return
    startTransition(async () => {
      let finalVideoUrl = editVideoUrl

      let finalThumbnailUrl = editThumbnailUrl

      if (editVideoFile) {
        // Clear thumbnail if we are uploading a new video so the video preview shows
        finalThumbnailUrl = '' 

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          toast.error('Supabase URL and Anon Key are missing in .env')
          return
        }

        const fileExt = editVideoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

        setEditUploadProgress(10)

        const { data, error } = await supabase.storage
          .from('signs_library')
          .upload(filePath, editVideoFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          toast.error(`Upload failed: ${error.message}`)
          setEditUploadProgress(0)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('signs_library')
          .getPublicUrl(filePath)

        finalVideoUrl = publicUrl
        setEditUploadProgress(100)
      }

      const result = await updateLibrarySign(editingSign.id, {
        name: editName,
        category: editCategory,
        difficulty: editDifficulty,
        tags: editTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        source: editSource,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl || null,
      })

      if (result.success) {
        // Create the updated sign object
        const updatedSign: SignLibraryEntry = {
          ...editingSign,
          name: editName,
          category: editCategory,
          difficulty: editDifficulty,
          tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
          source: editSource,
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalThumbnailUrl || null,
        }

        // Update local state immediately
        setSigns(prev => prev.map(s => s.id === editingSign.id ? updatedSign : s))
        
        toast.success('Sign updated successfully!')
        setEditingSign(null)
      } else {
        toast.error(result.message || 'Failed to update sign')
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteLibrarySign(id)
      if (result.success) {
        setSigns(prev => prev.filter(s => s.id !== id))
        toast.success('Sign deleted')
      } else {
        toast.error(result.message)
      }
      setDeletingId(null)
    })
  }

  const handleClearLibrary = () => {
    startTransition(async () => {
      const result = await clearLibrarySigns()
      if (result.success) {
        setSigns([])
        toast.success('Library cleared!')
      } else {
        toast.error(result.message)
      }
      setShowClearConfirm(false)
    })
  }

  return (
    <div className="lib-mgr">
      {/* Header */}
      <div className="lib-mgr__header">
        <div className="lib-mgr__header-text">
          <div className="lib-mgr__header-icon">
            <Library size={22} />
          </div>
          <div>
            <h1 className="lib-mgr__title">Sign Resource Library</h1>
            <p className="lib-mgr__subtitle">
              {signs.length} sign{signs.length !== 1 ? 's' : ''} in the global library
            </p>
          </div>
        </div>
        <div className="lib-mgr__header-actions">
          <Button
            variant="outline"
            className="gap-2 border-zinc-700 hover:bg-zinc-800"
            onClick={() => setShowBulkImport(v => !v)}
            id="bulk-import-toggle-btn"
          >
            <FileJson className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-red-900/50 hover:bg-red-950/30 text-red-400"
            onClick={() => setShowClearConfirm(true)}
            id="clear-library-btn"
          >
            <Trash2 className="h-4 w-4" />
            Clear Library
          </Button>
          <SignUploadModal
            onSuccess={() => {
              // Reload will happen on next navigation; for now show a hint
              toast.info('Refresh the page to see the newly added sign.')
            }}
          />
        </div>
      </div>

      {/* Bulk Import Panel */}
      {showBulkImport && (
        <div className="lib-mgr__bulk-import">
          <BulkImportPanel
            onImportComplete={(result) => {
              if (result.inserted > 0) {
                toast.info('Refresh the page to see imported signs.')
              }
            }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="lib-mgr__filters">
        <div className="lib-mgr__search-wrap">
          <Search className="lib-mgr__search-icon" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or tag…"
            className="lib-mgr__search-input"
            id="library-search-input"
          />
          {search && (
            <button
              className="lib-mgr__search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="lib-mgr__filter-select" id="library-category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            {CATEGORY_OPTIONS.map(c => (
              <SelectItem key={c} value={c} className="capitalize text-zinc-100 focus:bg-zinc-700 focus:text-white">
                {c === 'all' ? 'All Categories' : c.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="lib-mgr__filter-select" id="library-difficulty-filter">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            {DIFFICULTY_OPTIONS.map(d => (
              <SelectItem key={d} value={d} className="capitalize text-zinc-100 focus:bg-zinc-700 focus:text-white">
                {d === 'all' ? 'All Difficulties' : d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <p className="lib-mgr__count">
        <LayoutGrid className="inline h-4 w-4 mr-1 opacity-50" />
        Showing <strong>{filtered.length}</strong> of {signs.length} signs
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="lib-mgr__empty">
          <Library className="lib-mgr__empty-icon" />
          <p className="lib-mgr__empty-text">No signs match your filters.</p>
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategoryFilter('all'); setDifficultyFilter('all') }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="lib-mgr__grid">
          {filtered.map(sign => (
            <div key={sign.id} className="lib-mgr__card-wrap">
              <LibrarySignCard 
                sign={sign} 
                selectable 
                onClick={(s) => setPreviewSign(s)} 
              />
              <div className="lib-mgr__card-actions">
                <button
                  className="lib-mgr__action-btn lib-mgr__action-btn--edit"
                  onClick={() => openEditModal(sign)}
                  title="Edit sign"
                  id={`edit-sign-${sign.id}`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  className="lib-mgr__action-btn lib-mgr__action-btn--ai"
                  onClick={() => setBlueprintingSign(sign)}
                  title="Manage AI Blueprint"
                  id={`blueprint-sign-${sign.id}`}
                >
                  <Shield className="h-3.5 w-3.5" />
                </button>
                <button
                  className="lib-mgr__action-btn lib-mgr__action-btn--delete"
                  onClick={() => setDeletingId(sign.id)}
                  title="Delete sign"
                  id={`delete-sign-${sign.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSign} onOpenChange={v => { if (!v && !isPending) setEditingSign(null) }}>
        <DialogContent className="sm:max-w-[480px] bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Edit Sign</DialogTitle>
            <DialogDescription className="text-zinc-400">Update the library sign details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-sign-name">Name</Label>
              <Input id="edit-sign-name" value={editName} onChange={e => setEditName(e.target.value)} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={v => setEditCategory(v as LibraryCategory)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="alphabet" className="text-zinc-100 focus:bg-zinc-700 focus:text-white">Alphabet</SelectItem>
                    <SelectItem value="numbers" className="text-zinc-100 focus:bg-zinc-700 focus:text-white">Numbers</SelectItem>
                    <SelectItem value="greetings" className="text-zinc-100 focus:bg-zinc-700 focus:text-white">Greetings</SelectItem>
                    <SelectItem value="common_words" className="text-zinc-100 focus:bg-zinc-700 focus:text-white">Common Words</SelectItem>
                    <SelectItem value="custom" className="text-zinc-100 focus:bg-zinc-700 focus:text-white">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <Select value={editDifficulty} onValueChange={v => setEditDifficulty(v as LibraryDifficulty)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="beginner" className="text-zinc-100 focus:bg-zinc-700 focus:text-white">Beginner</SelectItem>
                    <SelectItem value="intermediate" className="text-zinc-100 focus:bg-zinc-700 focus:text-white">Intermediate</SelectItem>
                    <SelectItem value="advanced" className="text-zinc-100 focus:bg-zinc-700 focus:text-white">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sign-tags">Tags <span className="text-zinc-500 text-xs">(comma-separated)</span></Label>
              <Input id="edit-sign-tags" value={editTags} onChange={e => setEditTags(e.target.value)} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="grid gap-2">
              <Label>Video</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => document.getElementById('edit-sign-video-file')?.click()}
                    className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                    disabled={isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {editVideoFile ? 'Change File' : 'Upload MP4'}
                  </Button>
                  <span className="text-sm text-zinc-400 truncate max-w-[200px]">
                    {editVideoFile ? editVideoFile.name : 'No file selected'}
                  </span>
                  <input 
                    id="edit-sign-video-file" 
                    type="file" 
                    accept="video/mp4,video/webm" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setEditVideoFile(file)
                        setEditVideoUrl('') 
                      }
                    }}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-px bg-zinc-800 flex-1"></div>
                  <span className="text-xs text-zinc-500 uppercase">OR PASTE URL</span>
                  <div className="h-px bg-zinc-800 flex-1"></div>
                </div>

                <Input 
                  id="edit-sign-video" 
                  value={editVideoUrl} 
                  onChange={e => {
                    setEditVideoUrl(e.target.value)
                    if (e.target.value) setEditVideoFile(null)
                  }} 
                  disabled={isPending || !!editVideoFile}
                  placeholder="Video URL"
                  className="bg-zinc-900 border-zinc-700" 
                />
              </div>
              {editUploadProgress > 0 && editUploadProgress < 100 && (
                <p className="text-xs text-indigo-400 mt-1">Uploading video... Please wait.</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sign-thumbnail">Thumbnail URL <span className="text-zinc-500 text-xs">(optional, overrides video preview)</span></Label>
              <Input id="edit-sign-thumbnail" value={editThumbnailUrl} onChange={e => setEditThumbnailUrl(e.target.value)} placeholder="https://..." className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sign-source">Source</Label>
              <Input id="edit-sign-source" value={editSource} onChange={e => setEditSource(e.target.value)} className="bg-zinc-900 border-zinc-700" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingSign(null)} disabled={isPending} className="border-zinc-700">Cancel</Button>
            <Button onClick={handleEditSave} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-500">
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deletingId} onOpenChange={v => { if (!v && !isPending) setDeletingId(null) }}>
        <DialogContent className="sm:max-w-[380px] bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Sign?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              This will remove the sign from the library permanently. Lesson slots using this sign will lose their reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeletingId(null)} disabled={isPending} className="border-zinc-700">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={isPending}
              id="confirm-delete-sign-btn"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirm Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={v => { if (!v && !isPending) setShowClearConfirm(false) }}>
        <DialogContent className="sm:max-w-[400px] bg-zinc-950 border-red-900/50 text-white">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-xl">Clear Entire Library?</DialogTitle>
            </div>
            <DialogDescription className="text-zinc-400">
              This will <strong className="text-red-400">PERMANENTLY DELETE</strong> all {signs.length} signs from the library.
              <br /><br />
              All lessons that use these signs will lose their video content and AI detection blueprints. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowClearConfirm(false)} disabled={isPending} className="border-zinc-700">Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleClearLibrary}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-500"
              id="confirm-clear-library-btn"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Yes, Clear Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Blueprint Dialog */}
      <Dialog open={!!blueprintingSign} onOpenChange={v => { if (!v) setBlueprintingSign(null) }}>
        <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>AI Detection Blueprint</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Record a "Gold Standard" performance for <strong>{blueprintingSign?.name}</strong>. 
              This will be used to calibrate the AI for all learners.
            </DialogDescription>
          </DialogHeader>
          {blueprintingSign && (
            <SignBlueprintCapture 
              signId={blueprintingSign.id} 
              signName={blueprintingSign.name}
              onComplete={() => setBlueprintingSign(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        .lib-mgr {
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

        .lib-mgr__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .lib-mgr__header-text {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .lib-mgr__header-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #818cf8;
        }
        .lib-mgr__title {
          font-size: 24px;
          font-weight: 800;
          color: hsl(var(--foreground) / 0.95);
          letter-spacing: -0.5px;
        }
        .lib-mgr__subtitle {
          font-size: 13px;
          color: hsl(var(--foreground) / 0.6);
          margin-top: 2px;
        }
        .lib-mgr__header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .lib-mgr__bulk-import {
          animation: fadeIn 0.25s ease;
        }
        .lib-mgr__filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .lib-mgr__search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        .lib-mgr__search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: hsl(var(--foreground) / 0.4);
          pointer-events: none;
        }
        .lib-mgr__search-input {
          padding-left: 36px !important;
          padding-right: 36px !important;
          background: hsl(var(--foreground) / 0.04) !important;
          border-color: hsl(var(--foreground) / 0.1) !important;
        }
        .lib-mgr__search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: hsl(var(--foreground) / 0.4);
          display: flex;
          align-items: center;
          padding: 2px;
          border-radius: 4px;
        }
        .lib-mgr__search-clear:hover { color: hsl(var(--foreground) / 0.8); }
        .lib-mgr__filter-select {
          min-width: 160px;
          background: hsl(var(--foreground) / 0.04) !important;
          border-color: hsl(var(--foreground) / 0.1) !important;
        }
        .lib-mgr__count {
          font-size: 13px;
          color: hsl(var(--foreground) / 0.5);
          display: flex;
          align-items: center;
        }
        .lib-mgr__count strong {
          color: hsl(var(--foreground) / 0.8);
          margin: 0 2px;
        }
        .lib-mgr__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }
        .lib-mgr__card-wrap {
          position: relative;
        }
        .lib-mgr__card-actions {
          position: absolute;
          top: 8px;
          left: 8px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .lib-mgr__card-wrap:hover .lib-mgr__card-actions { opacity: 1; }
        .lib-mgr__action-btn {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          backdrop-filter: blur(8px);
        }
        .lib-mgr__action-btn--edit {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }
        .lib-mgr__action-btn--edit:hover { background: rgba(255, 255, 255, 0.4); }
        .lib-mgr__action-btn--ai {
          background: rgba(99,102,241,0.25);
          color: #a5b4fc;
        }
        .lib-mgr__action-btn--ai:hover { background: rgba(99,102,241,0.4); }
        .lib-mgr__action-btn--delete {
          background: rgba(239,68,68,0.18);
          color: #fca5a5;
        }
        .lib-mgr__action-btn--delete:hover { background: rgba(239,68,68,0.35); }
        .lib-mgr__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
          gap: 12px;
          color: hsl(var(--foreground) / 0.4);
        }
        .lib-mgr__empty-icon { width: 48px; height: 48px; opacity: 0.25; }
        .lib-mgr__empty-text { font-size: 15px; color: hsl(var(--foreground) / 0.5); }
      `}</style>
      <Dialog open={!!previewSign} onOpenChange={v => { if (!v) setPreviewSign(null) }}>
        <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden bg-black border-zinc-800">
          {previewSign && (
            <div className="relative aspect-video w-full group">
              <video 
                src={previewSign.videoUrl} 
                autoPlay 
                loop 
                controls 
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4 pointer-events-none">
                <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white">
                  <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">
                    {previewSign.name}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Previewing the ASL sign for {previewSign.name}
                  </DialogDescription>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
                      {previewSign.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setPreviewSign(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors border border-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
