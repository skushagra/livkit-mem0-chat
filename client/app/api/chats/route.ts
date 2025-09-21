import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { Chat, CreateChatRequest, CreateChatResponse, GetChatsResponse } from '@/types/chat'

const DATABASE_NAME = 'chatapp'
const COLLECTION_NAME = 'chats'

export async function POST(request: NextRequest) {
    try {
        const body: CreateChatRequest = await request.json()

        const client = await clientPromise
        const db = client.db(DATABASE_NAME)
        const collection = db.collection<Chat>(COLLECTION_NAME)

        const now = new Date()
        const newChat: Omit<Chat, '_id'> = {
            name: body.name || 'New AI Chat',
            subject: body.subject || 'Start a conversation with AI',
            date: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAI: true,
            messages: [],
            createdAt: now,
            updatedAt: now
        }

        const result = await collection.insertOne(newChat)

        const createdChat: Chat = {
            _id: result.insertedId,
            ...newChat
        }

        const response: CreateChatResponse = {
            success: true,
            chat: createdChat
        }

        return NextResponse.json(response, { status: 201 })
    } catch (error) {
        console.error('Error creating chat:', error)

        const response: CreateChatResponse = {
            success: false,
            error: 'Failed to create chat'
        }

        return NextResponse.json(response, { status: 500 })
    }
}

export async function GET() {
    try {
        const client = await clientPromise
        const db = client.db(DATABASE_NAME)
        const collection = db.collection<Chat>(COLLECTION_NAME)

        const chats = await collection
            .find({})
            .sort({ createdAt: -1 })
            .toArray()

        const response: GetChatsResponse = {
            success: true,
            chats
        }

        return NextResponse.json(response, { status: 200 })
    } catch (error) {
        console.error('Error fetching chats:', error)

        const response: GetChatsResponse = {
            success: false,
            error: 'Failed to fetch chats'
        }

        return NextResponse.json(response, { status: 500 })
    }
}