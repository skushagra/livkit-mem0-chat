import { ObjectId } from 'mongodb'

export interface Chat {
    _id?: ObjectId
    name: string
    subject: string
    date: string
    isAI: boolean
    messages?: Message[]
    createdAt: Date
    updatedAt: Date
}

export interface Message {
    _id?: ObjectId
    content: string
    sender: 'user' | 'ai'
    timestamp: Date
}

export interface CreateChatRequest {
    name?: string
    subject?: string
}

export interface CreateChatResponse {
    success: boolean
    chat?: Chat
    error?: string
}

export interface GetChatsResponse {
    success: boolean
    chats?: Chat[]
    error?: string
}