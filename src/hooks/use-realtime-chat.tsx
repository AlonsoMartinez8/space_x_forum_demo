'use client'

import { createClient } from '@/lib/client'
import { useCallback, useEffect, useState } from 'react'
import type { Message } from '@/types'

interface UseRealtimeChatProps {
  roomName: string
  username: string
}

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
  roomName?: string
}

const EVENT_MESSAGE_TYPE = 'message'

export function useRealtimeChat({ roomName, username }: UseRealtimeChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const newChannel = supabase.channel(roomName)

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessages((current) => {
          const incomingMessage = payload.payload as ChatMessage

          const alreadyExists = current.some(
            (message) => message.id === incomingMessage.id
          )

          if (alreadyExists) {
            return current
          }

          return [...current, incomingMessage]
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else {
          setIsConnected(false)
        }
      })

    setChannel(newChannel)

    return () => {
      supabase.removeChannel(newChannel)
    }
  }, [roomName, username, supabase])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected) return

      const systemId = Date.now()

      let createdMessage: Message | null = null

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            roomName,
            username,
            systemId,
          }),
        })

        if (!response.ok) {
          const { error } = (await response.json().catch(() => ({}))) as {
            error?: string
          }
          throw new Error(error ?? 'Failed to persist message')
        }

        const { message } = (await response.json()) as { message: Message }
        createdMessage = message
      } catch (error) {
        console.error('Failed to persist message', error)
        return
      }

      if (!createdMessage) {
        return
      }

      const message: ChatMessage = {
        id: createdMessage.id.toString(),
        content: createdMessage.content ?? '',
        user: {
          name: createdMessage.user_name,
        },
        createdAt: createdMessage.created_at,
        roomName: createdMessage.room_name,
      }

      setMessages((current) => {
        const alreadyExists = current.some((item) => item.id === message.id)
        if (alreadyExists) {
          return current
        }

        return [...current, message]
      })

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })
    },
    [channel, isConnected, roomName, username]
  )

  return { messages, sendMessage, isConnected }
}
