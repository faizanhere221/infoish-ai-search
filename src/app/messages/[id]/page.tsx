'use client'

import { useParams } from 'next/navigation'
import { MessagingShell } from '@/components/messaging'

export default function ConversationPage() {
  const params = useParams()
  const conversationId = params.id as string

  return <MessagingShell conversationId={conversationId} />
}
