'use client'

import { useState, useRef, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileJson, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { bulkImportSigns } from '@/lib/supabase/libraryQueries'
import type { BulkImportSignInput, BulkImportResult } from '@/types/library'

interface BulkImportPanelProps {
  onImportComplete?: (result: BulkImportResult) => void
}

export function BulkImportPanel({ onImportComplete }: BulkImportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<BulkImportSignInput[] | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseError(null)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        if (!Array.isArray(json)) {
          setParseError('JSON must be an array of sign objects.')
          setPreview(null)
          return
        }
        // Validate shape minimally
        const invalid = json.filter((s: any) => !s.name || !s.video_url)
        if (invalid.length > 0) {
          setParseError(`${invalid.length} entries are missing "name" or "video_url" fields.`)
        }
        // Map WLASL-style keys to our format
        const mapped: BulkImportSignInput[] = json.map((s: any) => ({
          name: s.name ?? '',
          category: s.category ?? 'custom',
          videoUrl: s.video_url ?? s.videoUrl ?? '',
          thumbnailUrl: s.thumbnail_url ?? s.thumbnailUrl ?? undefined,
          source: s.source ?? 'custom',
          difficulty: s.difficulty ?? 'beginner',
          tags: Array.isArray(s.tags) ? s.tags : (s.tags ? [s.tags] : []),
          landmarkBlueprint: s.landmark_blueprint ?? s.landmarkBlueprint ?? undefined,
        }))
        setPreview(mapped)
      } catch {
        setParseError('Invalid JSON file. Please check the format.')
        setPreview(null)
      }
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (!preview) return

    startTransition(async () => {
      const res = await bulkImportSigns(preview)
      setResult(res)
      onImportComplete?.(res)

      if (res.inserted > 0) {
        toast.success(`Imported ${res.inserted} sign${res.inserted !== 1 ? 's' : ''} successfully!`)
      }
      if (res.failed > 0) {
        toast.error(`${res.failed} sign${res.failed !== 1 ? 's' : ''} failed to import.`)
      }
    })
  }

  const handleReset = () => {
    setPreview(null)
    setParseError(null)
    setResult(null)
    setFileName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="bulk-import-panel">
      <div className="bulk-import-panel__header">
        <FileJson className="bulk-import-panel__icon" />
        <div>
          <h3 className="bulk-import-panel__title">Bulk Import Signs</h3>
          <p className="bulk-import-panel__desc">Import a JSON file matching WLASL format to populate the library.</p>
        </div>
      </div>

      {/* Format hint */}
      <div className="bulk-import-panel__format-hint">
        <span className="bulk-import-panel__format-label">Expected format:</span>
        <pre className="bulk-import-panel__pre">{`[{ "name": "Hello", "category": "greetings", "video_url": "https://...", "source": "WLASL", "difficulty": "beginner", "tags": ["greeting"] }]`}</pre>
      </div>

      {/* Drop Zone */}
      {!preview && !result && (
        <div
          className="bulk-import-panel__dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const file = e.dataTransfer.files?.[0]
            if (file && fileInputRef.current) {
              // Manually trigger file parsing
              const dt = new DataTransfer()
              dt.items.add(file)
              fileInputRef.current.files = dt.files
              handleFileChange({ target: fileInputRef.current } as any)
            }
          }}
        >
          <Upload className="bulk-import-panel__drop-icon" />
          <span className="bulk-import-panel__drop-text">
            {fileName ? fileName : 'Click or drag a .json file here'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={handleFileChange}
            id="bulk-import-file"
          />
        </div>
      )}

      {/* Parse Error */}
      {parseError && (
        <div className="bulk-import-panel__error">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Preview Table */}
      {preview && !result && (
        <div className="bulk-import-panel__preview">
          <div className="bulk-import-panel__preview-header">
            <span className="bulk-import-panel__preview-count">
              {preview.length} sign{preview.length !== 1 ? 's' : ''} ready to import
            </span>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-zinc-400 hover:text-white text-xs">
              Clear
            </Button>
          </div>
          <div className="bulk-import-panel__preview-list">
            {preview.slice(0, 8).map((s, i) => (
              <div key={i} className="bulk-import-panel__preview-row">
                <span className="bulk-import-panel__preview-name">{s.name}</span>
                <span className="bulk-import-panel__preview-cat">{s.category}</span>
                <span className="bulk-import-panel__preview-diff">{s.difficulty}</span>
              </div>
            ))}
            {preview.length > 8 && (
              <div className="bulk-import-panel__preview-more">
                + {preview.length - 8} more…
              </div>
            )}
          </div>
          <div className="bulk-import-panel__actions">
            <Button variant="outline" onClick={handleReset} className="border-zinc-700">Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-500 gap-2"
              id="bulk-import-confirm-btn"
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
              ) : (
                <><Upload className="h-4 w-4" /> Import {preview.length} Signs</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Result Summary */}
      {result && (
        <div className="bulk-import-panel__result">
          <div className="bulk-import-panel__result-row">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">{result.inserted} inserted</span>
          </div>
          {result.failed > 0 && (
            <div className="bulk-import-panel__result-row">
              <XCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-400 font-semibold">{result.failed} failed</span>
            </div>
          )}
          {result.errors.length > 0 && (
            <ul className="bulk-import-panel__result-errors">
              {result.errors.slice(0, 5).map((err, i) => (
                <li key={i} className="bulk-import-panel__result-error">{err}</li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" onClick={handleReset} className="border-zinc-700 mt-2">
            Import Another File
          </Button>
        </div>
      )}

      <style>{`
        .bulk-import-panel {
          background: hsl(var(--foreground) / 0.02);
          border: 1px solid hsl(var(--foreground) / 0.08);
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .bulk-import-panel__header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .bulk-import-panel__icon {
          width: 24px;
          height: 24px;
          color: #818cf8;
          shrink: 0;
          margin-top: 2px;
        }
        .bulk-import-panel__title {
          font-size: 16px;
          font-weight: 700;
          color: hsl(var(--foreground) / 0.9);
        }
        .bulk-import-panel__desc {
          font-size: 13px;
          color: hsl(var(--foreground) / 0.5);
          margin-top: 2px;
        }
        .bulk-import-panel__format-hint {
          background: hsl(var(--foreground) / 0.03);
          border: 1px solid hsl(var(--foreground) / 0.06);
          border-radius: 8px;
          padding: 10px 14px;
        }
        .bulk-import-panel__format-label {
          font-size: 11px;
          font-weight: 600;
          color: hsl(var(--foreground) / 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 6px;
        }
        .bulk-import-panel__pre {
          font-size: 11px;
          color: hsl(var(--foreground) / 0.6);
          white-space: pre-wrap;
          word-break: break-all;
          font-family: 'Courier New', monospace;
          line-height: 1.5;
          margin: 0;
        }
        .bulk-import-panel__dropzone {
          border: 2px dashed rgba(99,102,241,0.4);
          border-radius: 12px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .bulk-import-panel__dropzone:hover {
          background: rgba(99,102,241,0.06);
          border-color: rgba(99,102,241,0.7);
        }
        .bulk-import-panel__drop-icon {
          width: 32px;
          height: 32px;
          color: rgba(99,102,241,0.6);
        }
        .bulk-import-panel__drop-text {
          font-size: 14px;
          color: hsl(var(--foreground) / 0.6);
        }
        .bulk-import-panel__error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          color: #fca5a5;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
        }
        .bulk-import-panel__preview {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bulk-import-panel__preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .bulk-import-panel__preview-count {
          font-size: 13px;
          color: hsl(var(--foreground) / 0.6);
          font-weight: 600;
        }
        .bulk-import-panel__preview-list {
          background: hsl(var(--foreground) / 0.02);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid hsl(var(--foreground) / 0.06);
        }
        .bulk-import-panel__preview-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 12px;
          padding: 8px 12px;
          font-size: 12px;
          border-bottom: 1px solid hsl(var(--foreground) / 0.04);
          align-items: center;
        }
        .bulk-import-panel__preview-row:last-child {
          border-bottom: none;
        }
        .bulk-import-panel__preview-name {
          color: hsl(var(--foreground) / 0.85);
          font-weight: 600;
          truncate: true;
        }
        .bulk-import-panel__preview-cat {
          color: rgba(99,102,241,0.9);
          font-size: 11px;
        }
        .bulk-import-panel__preview-diff {
          color: hsl(var(--foreground) / 0.45);
          font-size: 11px;
        }
        .bulk-import-panel__preview-more {
          padding: 8px 12px;
          font-size: 12px;
          color: hsl(var(--foreground) / 0.4);
          text-align: center;
        }
        .bulk-import-panel__actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .bulk-import-panel__result {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: hsl(var(--foreground) / 0.03);
          border-radius: 10px;
          padding: 16px;
          border: 1px solid hsl(var(--foreground) / 0.06);
        }
        .bulk-import-panel__result-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bulk-import-panel__result-errors {
          list-style: none;
          padding: 0;
          margin: 4px 0 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bulk-import-panel__result-error {
          font-size: 12px;
          color: rgba(252,165,165,0.75);
        }
      `}</style>
    </div>
  )
}
