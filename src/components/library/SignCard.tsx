'use client'

import { PlayCircle, CheckCircle2 } from 'lucide-react'
import type { SignLibraryEntry } from '@/types/library'

const CATEGORY_COLORS: Record<string, string> = {
  alphabet: '#6366f1',     // indigo
  numbers: '#f59e0b',      // amber
  greetings: '#10b981',    // emerald
  common_words: '#3b82f6', // blue
  custom: '#8b5cf6',       // violet
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
}

interface SignCardProps {
  sign: SignLibraryEntry
  selected?: boolean
  selectable?: boolean
  onClick?: (sign: SignLibraryEntry) => void
}

export function LibrarySignCard({ sign, selected = false, selectable = false, onClick }: SignCardProps) {
  const categoryColor = CATEGORY_COLORS[sign.category] ?? '#6366f1'
  const difficultyColor = DIFFICULTY_COLORS[sign.difficulty] ?? '#10b981'

  return (
    <div
      onClick={() => onClick?.(sign)}
      className={`relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200 ${
        selectable ? 'cursor-pointer hover:-translate-y-[2px] hover:shadow-lg' : ''
      } ${
        selected 
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5' 
          : 'border-border bg-card hover:border-border/80'
      }`}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={selectable ? (e) => e.key === 'Enter' && onClick?.(sign) : undefined}
      aria-pressed={selectable ? selected : undefined}
    >
      {/* Thumbnail / Video Preview */}
      <div className="relative w-full h-[110px] bg-black overflow-hidden group shrink-0">
        {sign.thumbnailUrl ? (
          <img
            key={sign.thumbnailUrl}
            src={sign.thumbnailUrl}
            alt={sign.name}
            className="w-full h-full object-cover"
          />
        ) : sign.videoUrl ? (
          <video
            key={sign.videoUrl}
            src={sign.videoUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            loop
            onMouseOver={e => (e.currentTarget as HTMLVideoElement).play()}
            onMouseOut={e => {
              const v = e.currentTarget as HTMLVideoElement
              v.pause()
              v.currentTime = 0
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
            No Preview
          </div>
        )}

        {/* Play Hover Overlay */}
        {sign.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <PlayCircle className="w-10 h-10 text-white drop-shadow-md" />
          </div>
        )}

        {/* Selected Checkmark */}
        {selected && (
          <div className="absolute top-2 right-2 bg-indigo-500 rounded-full w-7 h-7 flex items-center justify-center text-white shadow-md">
            <CheckCircle2 className="w-[18px] h-[18px]" />
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col gap-2 p-3 flex-1 min-h-[80px] bg-card">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-[15px] leading-tight truncate text-foreground dark:text-white">
            {sign.name || 'Unknown Sign'}
          </h3>
          <span
            className="shrink-0 w-2.5 h-2.5 rounded-full shadow-sm"
            style={{ background: difficultyColor }}
            title={sign.difficulty}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
            style={{ 
              background: `${categoryColor}15`, 
              color: categoryColor, 
              borderColor: `${categoryColor}30` 
            }}
          >
            {sign.category.replace('_', ' ')}
          </span>
          {sign.landmarkBlueprint && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 tracking-wide">
              AI
            </span>
          )}
        </div>

        {sign.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {sign.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[11px] text-muted-foreground truncate max-w-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
