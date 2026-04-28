'use client'

import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Library, Upload, X, Loader2, Check } from 'lucide-react'
import { LibrarySignCard } from './SignCard'
import type { SignLibraryEntry } from '@/types/library'
import { useDebounce } from 'use-debounce'

interface SignPickerProps {
  /** All signs available from the library */
  librarySigns: SignLibraryEntry[]
  /** Called when user selects a library sign */
  onSelectLibrarySign: (sign: SignLibraryEntry) => void
  /** Called when user submits a custom video URL */
  onSubmitCustom: (videoUrl: string) => void
  /** Currently selected library sign ID (if any) */
  selectedSignId?: string | null
  /** Whether the picker is in a loading/pending state */
  isLoading?: boolean
}

const CATEGORY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'alphabet', label: 'Alphabet' },
  { value: 'numbers', label: 'Numbers' },
  { value: 'greetings', label: 'Greetings' },
  { value: 'common_words', label: 'Common Words' },
  { value: 'custom', label: 'Custom' },
] as const

type CategoryFilter = typeof CATEGORY_FILTERS[number]['value']

export function SignPicker({
  librarySigns,
  onSelectLibrarySign,
  onSubmitCustom,
  selectedSignId,
  isLoading = false,
}: SignPickerProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 250)
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  const [customVideoUrl, setCustomVideoUrl] = useState('')

  const filtered = useMemo(() => {
    return librarySigns.filter(sign => {
      const matchesCategory = activeCategory === 'all' || sign.category === activeCategory
      if (!matchesCategory) return false
      if (!debouncedSearch) return true
      const q = debouncedSearch.toLowerCase()
      return (
        sign.name.toLowerCase().includes(q) ||
        sign.tags.some(t => t.toLowerCase().includes(q))
      )
    })
  }, [librarySigns, activeCategory, debouncedSearch])

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customVideoUrl.trim()) return
    onSubmitCustom(customVideoUrl.trim())
    setCustomVideoUrl('')
  }

  return (
    <div className="w-full">
      <Tabs defaultValue="library" className="w-full">
        <TabsList className="bg-foreground/5 border border-foreground/10 rounded-lg p-1 flex gap-1 mb-4">
          <TabsTrigger value="library" className="flex-1 rounded-md text-[13px] font-semibold py-2 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-500 data-[state=active]:border-indigo-500/30 transition-all text-foreground/50 hover:text-foreground/80">
            <Library className="h-4 w-4 mr-2" />
            Choose from Library
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex-1 rounded-md text-[13px] font-semibold py-2 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-500 data-[state=active]:border-indigo-500/30 transition-all text-foreground/50 hover:text-foreground/80">
            <Upload className="h-4 w-4 mr-2" />
            Upload Custom
          </TabsTrigger>
        </TabsList>

        {/* ── Library Tab ── */}
        <TabsContent value="library" className="flex flex-col gap-3 mt-3 outline-none">
          {/* Search */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search signs by name or tag…"
                className="pl-9 pr-9 bg-foreground/5 border-foreground/10 h-10 w-full"
                id="sign-picker-search"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors p-1"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setActiveCategory(value)}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all duration-150 ${
                  activeCategory === value
                    ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-500'
                    : 'border-foreground/10 text-foreground/60 bg-foreground/5 hover:border-indigo-500/50 hover:text-foreground/90'
                }`}
                id={`sign-picker-chip-${value}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Results Count */}
          <p className="text-xs text-foreground/40">
            {filtered.length} sign{filtered.length !== 1 ? 's' : ''} found
          </p>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-foreground/40 text-sm">
              <Library className="w-10 h-10 opacity-30" />
              <p>No signs match your filters.</p>
            </div>
          ) : (
            <div
              className="grid gap-3 pr-1 pb-2"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                maxHeight: '420px',
                overflowY: 'auto',
              }}
            >
              {filtered.map(sign => (
                <LibrarySignCard
                  key={sign.id}
                  sign={sign}
                  selected={selectedSignId === sign.id}
                  selectable
                  onClick={onSelectLibrarySign}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Custom Upload Tab ── */}
        <TabsContent value="custom" className="flex flex-col gap-4 mt-3 outline-none">
          <div className="flex flex-col items-center gap-4 py-8 px-6 bg-foreground/5 border-2 border-dashed border-indigo-500/30 rounded-xl">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Upload a Custom Sign Video</h3>
            <p className="text-sm text-foreground/50 text-center max-w-md leading-relaxed">
              Upload your video to Supabase Storage (signs_library bucket), then paste the public URL below.
              You can record a blueprint after saving.
            </p>

            <form onSubmit={handleCustomSubmit} className="flex flex-col gap-3 w-full max-w-md mt-2">
              <div className="grid gap-2 w-full">
                <Label htmlFor="custom-video-url" className="text-sm font-medium">
                  Video URL
                </Label>
                <Input
                  id="custom-video-url"
                  value={customVideoUrl}
                  onChange={e => setCustomVideoUrl(e.target.value)}
                  placeholder="https://... (public Supabase storage URL)"
                  className="bg-foreground/5 border-foreground/10"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !customVideoUrl.trim()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white w-full gap-2 transition-colors"
                id="sign-picker-custom-submit"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</>
                ) : (
                  <><Check className="h-4 w-4" /> Use This Video</>
                )}
              </Button>
            </form>

            {selectedSignId === null && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2 mt-2 text-center">
                ✓ A custom video slot has been created. Record an AI blueprint from the lesson builder after saving.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
