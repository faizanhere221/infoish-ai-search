'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Eye, EyeOff } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  rowKey: (row: T) => string
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectChange?: (ids: Set<string>) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: string, order: 'asc' | 'desc') => void
  stickyHeader?: boolean
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = 'No data found',
  rowKey,
  selectable,
  selectedIds,
  onSelectChange,
  sortBy,
  sortOrder,
  onSort,
  stickyHeader = true,
}: DataTableProps<T>) {
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
  const [showColToggle, setShowColToggle] = useState(false)

  const visibleCols = useMemo(() => columns.filter(c => !hiddenCols.has(c.key)), [columns, hiddenCols])

  function toggleCol(key: string) {
    setHiddenCols(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleSort(key: string) {
    if (!onSort) return
    if (sortBy === key) {
      onSort(key, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSort(key, 'desc')
    }
  }

  const allSelected = data.length > 0 && data.every(row => selectedIds?.has(rowKey(row)))
  const someSelected = !allSelected && data.some(row => selectedIds?.has(rowKey(row)))

  function toggleAll() {
    if (!onSelectChange) return
    if (allSelected) {
      const next = new Set(selectedIds)
      data.forEach(row => next.delete(rowKey(row)))
      onSelectChange(next)
    } else {
      const next = new Set(selectedIds)
      data.forEach(row => next.add(rowKey(row)))
      onSelectChange(next)
    }
  }

  function toggleRow(id: string) {
    if (!onSelectChange || !selectedIds) return
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectChange(next)
  }

  return (
    <div className="relative">
      {/* Column visibility toggle */}
      <div className="flex justify-end mb-2">
        <div className="relative">
          <button
            onClick={() => setShowColToggle(!showColToggle)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Columns
          </button>
          {showColToggle && (
            <div className="absolute right-0 top-8 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-3 min-w-[160px]">
              <div className="text-xs text-slate-400 mb-2 font-medium">Toggle columns</div>
              {columns.map(col => (
                <label key={col.key} className="flex items-center gap-2 py-1 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!hiddenCols.has(col.key)}
                    onChange={() => toggleCol(col.key)}
                    className="rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-300 group-hover:text-white">{col.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="bg-slate-800 border-b border-slate-700/50">
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected }}
                    onChange={toggleAll}
                    className="rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500"
                  />
                </th>
              )}
              {visibleCols.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap ${col.width ?? ''} ${col.sortable && onSort ? 'cursor-pointer select-none hover:text-white' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && onSort && (
                      sortBy === col.key ? (
                        sortOrder === 'asc'
                          ? <ChevronUp className="w-3 h-3 text-violet-400" />
                          : <ChevronDown className="w-3 h-3 text-violet-400" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-40" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="bg-slate-800/30">
                  {selectable && <td className="px-3 py-3"><div className="h-4 w-4 bg-slate-700 rounded animate-pulse" /></td>}
                  {visibleCols.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-slate-700 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCols.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map(row => {
                const id = rowKey(row)
                const selected = selectedIds?.has(id)
                return (
                  <tr
                    key={id}
                    className={`transition-colors ${selected ? 'bg-violet-900/10' : 'bg-slate-800/20 hover:bg-slate-800/50'}`}
                  >
                    {selectable && (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => toggleRow(id)}
                          className="rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500"
                        />
                      </td>
                    )}
                    {visibleCols.map(col => (
                      <td key={col.key} className="px-4 py-3 text-slate-300">
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
