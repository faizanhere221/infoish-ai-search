'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'

interface TodoItem {
  deliverable_id: string
  campaign_creator_id: string
  title: string
  campaign_title: string | null
}

// Nudges a creator to log results for something they already posted.
// Renders nothing while loading or if there's nothing to show.
export function ResultsTodoWidget() {
  const [todo, setTodo] = useState<TodoItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {return}
    fetch('/api/campaign-creators/results-todo', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : { todo: [] }))
      .then((data) => setTodo(data.todo || []))
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded || todo.length === 0) {return null}

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
        <BarChart3 className="w-4 h-4 text-blue-600" />
        Add your results for {todo.length} post{todo.length === 1 ? '' : 's'}
      </h3>
      <div className="space-y-2">
        {todo.map((item) => (
          <Link
            key={item.deliverable_id}
            href={`/dashboard/my-campaigns/${item.campaign_creator_id}`}
            className="flex items-center justify-between bg-white rounded-lg p-3 hover:shadow-sm transition-shadow"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500">{item.campaign_title}</p>
            </div>
            <span className="text-xs text-blue-600 font-medium">Add results</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ResultsTodoWidget
