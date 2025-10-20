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

      const { data, error } = await supabase
        .from('message')
        .insert({
          content,
          room_name: roomName,
          user_name: username,
          system_id: systemId,
        })
        .select()
        .single<Message>()

      if (error || !data) {
        console.error('Failed to persist message', error)
        return
      }

      const message: ChatMessage = {
        id: data.id.toString(),
        content: data.content ?? '',
        user: {
          name: data.user_name,
        },
        createdAt: data.created_at,
        roomName: data.room_name,
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
    [channel, isConnected, roomName, supabase, username]
  )

  return { messages, sendMessage, isConnected }
}
