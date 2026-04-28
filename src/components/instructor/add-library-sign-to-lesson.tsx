'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SignPicker } from '@/components/library/SignPicker'
import { addSignToLesson } from '@/lib/supabase/libraryQueries'
import type { SignLibraryEntry } from '@/types/library'

interface AddLibrarySignToLessonProps {
  lessonId: string
  lessonTitle: string
  librarySigns: SignLibraryEntry[]
}

export function AddLibrarySignToLesson({
  lessonId,
  lessonTitle,
  librarySigns,
}: AddLibrarySignToLessonProps) {
  const [open, setOpen] = useState(false)
  const [selectedSign, setSelectedSign] = useState<SignLibraryEntry | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSelectLibrary = (sign: SignLibraryEntry) => {
    setSelectedSign(sign)
  }

  const handleSelectCustom = (videoUrl: string) => {
    startTransition(async () => {
      const result = await addSignToLesson(lessonId, undefined, { customVideoUrl: videoUrl })
      if (result.success) {
        toast.success('Custom sign added to chapter!')
        setOpen(false)
        setSelectedSign(null)
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleConfirmLibrary = () => {
    if (!selectedSign) return
    startTransition(async () => {
      const result = await addSignToLesson(lessonId, selectedSign.id)
      if (result.success) {
        toast.success(`"${selectedSign.name}" added to chapter!`)
        setOpen(false)
        setSelectedSign(null)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40"
        onClick={() => setOpen(true)}
        id={`add-library-sign-${lessonId}`}
      >
        <BookOpen className="h-3.5 w-3.5" />
        Add from Library
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!isPending) {
            setOpen(v)
            if (!v) setSelectedSign(null)
          }
        }}
      >
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
          {/* Modal Header */}
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle className="text-xl font-bold">Add Sign to "{lessonTitle}"</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Pick a sign from the library or upload a custom video.
            </DialogDescription>
          </DialogHeader>

          {/* Picker — scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
          <SignPicker
              librarySigns={librarySigns}
              onSelectLibrarySign={handleSelectLibrary}
              onSubmitCustom={handleSelectCustom}
              selectedSignId={selectedSign?.id ?? null}
              isLoading={isPending}
            />
          </div>

          {/* Footer — confirm selected library sign */}
          {selectedSign && (
            <div className="shrink-0 px-6 py-4 border-t bg-muted/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {selectedSign.thumbnailUrl && (
                  <img
                    src={selectedSign.thumbnailUrl}
                    alt={selectedSign.name}
                    className="w-10 h-10 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{selectedSign.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{selectedSign.category.replace('_', ' ')} · {selectedSign.difficulty}</p>
                </div>
              </div>
              <Button
                onClick={handleConfirmLibrary}
                disabled={isPending}
                className="shrink-0 bg-indigo-600 hover:bg-indigo-500 gap-2"
                id="confirm-add-library-sign-btn"
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</>
                ) : (
                  <>Add "{selectedSign.name}" to Chapter</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
