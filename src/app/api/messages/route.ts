import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/service-role-client'
import type { Message } from '@/types'

interface CreateMessagePayload {
  content: string
  roomName: string
  username: string
  systemId: number
}

export async function POST(request: Request) {
  let payload: CreateMessagePayload

  try {
    payload = (await request.json()) as CreateMessagePayload
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { content, roomName, username, systemId } = payload

  if (!roomName || !username) {
    return NextResponse.json(
      { error: 'roomName and username are required' },
      { status: 400 }
    )
  }

  const supabase = createServiceRoleClient()

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
    return NextResponse.json(
      { error: error?.message ?? 'Failed to persist message' },
      { status: 500 }
    )
  }

  return NextResponse.json({ message: data }, { status: 201 })
}
