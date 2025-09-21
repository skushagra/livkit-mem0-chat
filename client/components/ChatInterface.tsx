"use client"

import React from "react";
import LiveKitChat from "./LiveKitChat";
import { Chat } from "@/types/chat";

interface ChatInterfaceProps {
    chat: Chat | null;
    onClose?: () => void;
}

export default function ChatInterface({ chat, onClose }: ChatInterfaceProps) {
    if (!chat) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground bg-gradient-to-br from-background to-muted/20">
                <div className="text-center max-w-md mx-auto px-8">
                    <div className="mb-6">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                            >
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold mb-3 text-foreground">Welcome to AI Chat</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Select a chat to start a conversation, or create a new chat to begin talking with AI.
                    </p>
                </div>
            </div>
        );
    }

    const roomName = `chat-${chat._id?.toString() || 'new'}`;
    const username = `user-${Math.floor(Math.random() * 1000)}`;

    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-semibold">{chat.name}</h1>
                        <p className="text-sm text-muted-foreground">{chat.subject}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{chat.date}</span>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors"
                            title="Close chat"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 relative bg-background">
                <LiveKitChat
                    roomName={roomName}
                    username={username}
                    showVideo={false}
                    onLeave={onClose}
                />
            </div>
        </div>
    );
}