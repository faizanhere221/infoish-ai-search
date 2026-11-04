'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// One table cell that turns into an editor on click.
// Enter saves, Esc cancels, leaving the cell (blur) saves too, like a
// spreadsheet. The parent does the optimistic update and rollback; when a
// save fails it reopens the cell with the typed value and the error.

export type CellEditor =
  | { type: 'text'; inputMode?: 'text' | 'email' | 'url' | 'decimal'; suggestions?: string[] }
  | { type: 'select'; options: { value: string; label: string }[] }

interface EditableCellProps {
  display: React.ReactNode
  value: string // current value as text, '' when empty
  editor: CellEditor
  editing: boolean
  readOnly?: boolean
  initial?: string // reopened after an error: what the user typed
  error?: string
  saving?: boolean
  className?: string
  title?: string
  onStart: () => void
  onCancel: () => void
  onSave: (value: string) => void
}

export function EditableCell({
  display, value, editor, editing, readOnly, initial, error, saving, className, title, onStart, onCancel, onSave,
}: EditableCellProps) {
  const [draft, setDraft] = useState(initial ?? value)
  const done = useRef(false)
  const listId = useId()

  useEffect(() => {
    if (editing) {
      setDraft(initial ?? value)
      done.current = false
    }
  }, [editing, initial, value])

  const finish = (save: boolean, v = draft) => {
    if (done.current) {return}
    done.current = true
    if (save && v.trim() !== value.trim()) {onSave(v)}
    else {onCancel()}
  }

  if (!editing) {
    return (
      <td
        className={cn('group max-w-[240px] px-3 py-2', !readOnly && 'cursor-text hover:bg-slate-800/60', className)}
        title={title}
        onClick={(e) => {
          if (readOnly) {return}
          if ((e.target as HTMLElement).closest('a')) {return} // let links open
          onStart()
        }}
      >
        <div className="flex items-center gap-1 truncate">
          {saving && <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin text-slate-500" />}
          <span className="truncate">{display}</span>
        </div>
      </td>
    )
  }

  const keyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      finish(true)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      finish(false)
    }
  }

  return (
    <td className={cn('px-1.5 py-1', className)}>
      {editor.type === 'select' ? (
        <select
          autoFocus
          value={draft}
          onChange={(e) => { setDraft(e.target.value); finish(true, e.target.value) }}
          onKeyDown={keyDown}
          onBlur={() => finish(true)}
          className="w-full min-w-[120px] rounded-md border border-violet-500 bg-slate-800 px-1.5 py-1 text-xs text-white focus:outline-none"
        >
          {editor.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={keyDown}
            onBlur={() => finish(true)}
            onFocus={(e) => e.currentTarget.select()}
            inputMode={editor.inputMode === 'url' ? 'url' : editor.inputMode}
            list={editor.suggestions ? listId : undefined}
            className={cn(
              'w-full min-w-[140px] rounded-md border bg-slate-800 px-1.5 py-1 text-xs text-white focus:outline-none',
              error ? 'border-red-500' : 'border-violet-500',
            )}
          />
          {editor.suggestions && (
            <datalist id={listId}>
              {editor.suggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
          )}
        </>
      )}
      {error && <p className="mt-0.5 max-w-[260px] whitespace-normal text-[11px] leading-tight text-red-400">{error}</p>}
    </td>
  )
}
