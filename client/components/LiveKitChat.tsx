"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Chat,
    LiveKitRoom,
    VideoConference,
    RoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import "../styles/livekit-chat.css";
import { Room, RoomEvent } from "livekit-client";
import CustomDataChat from "./CustomChatComponent";

interface LiveKitChatProps {
    roomName: string;
    username: string;
    serverUrl?: string;
    onLeave?: () => void;
    showVideo?: boolean;
}

export default function LiveKitChat({
    roomName,
    username,
    serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://attackchat-iitd0rzu.livekit.cloud",
    onLeave,
    showVideo = false,
}: LiveKitChatProps) {
    const [token, setToken] = useState<string>("");
    const [isConnecting, setIsConnecting] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // we still provide a Room via context (so all children share it)
    const room = useMemo(() => new Room(), []);

    const handleOnLeave = useCallback(() => onLeave?.(), [onLeave]);
    const handleError = useCallback((err: Error) => {
        console.error("[client] LiveKit error:", err);
        setError(err.message);
        setIsConnecting(false);
    }, []);

    // Prevent duplicate dispatches (StrictMode/reconnects)
    const didDispatchRef = useRef(false);

    // 1) fetch token only
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setIsConnecting(true);
                setError(null);

                const res = await fetch("/api/livekit-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomName, username }),
                });
                if (!res.ok) throw new Error(`Failed to get token: ${res.statusText}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                if (!cancelled) {
                    setToken(data.token);
                    setIsConnecting(false);
                }
            } catch (e) {
                console.error("[client] Failed to get access token:", e);
                if (!cancelled) {
                    setError("Failed to connect to chat room");
                    setIsConnecting(false);
                }
            }
        })();

        return () => {
            cancelled = true;
            didDispatchRef.current = false;
        };
    }, [roomName, username]);

    // 2) basic error/leave handlers on the shared Room instance
    useEffect(() => {
        room.on(RoomEvent.Disconnected, handleOnLeave);
        room.on(RoomEvent.MediaDevicesError, handleError);
        return () => {
            room.off(RoomEvent.Disconnected, handleOnLeave);
            room.off(RoomEvent.MediaDevicesError, handleError);
        };
    }, [room, handleOnLeave, handleError]);

    // 3) dispatch the agent exactly when LiveKitRoom reports it's connected
    const handleRoomConnected = useCallback(async () => {
        if (didDispatchRef.current) return;
        didDispatchRef.current = true;
        try {
            const res = await fetch("/api/dispatch-agent", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ roomName }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || `dispatch failed: ${res.status}`);
            }
            console.log("[client] dispatched agent for room:", roomName);
        } catch (e) {
            console.error("[client] dispatch failed:", e);
        }
    }, [roomName]);

    if (isConnecting) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
                    <p>Connecting to chat room...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-600">
                    <p className="mb-4">Failed to connect to chat room</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>No access token available</p>
            </div>
        );
    }

    return (
        <RoomContext.Provider value={room}>
            <LiveKitRoom
                style={{ height: "100%", width: "100%" }}
                data-lk-theme="default"
                token={token}
                serverUrl={serverUrl}
                connect // be explicit: auto-connect on mount
                onConnected={handleRoomConnected} // <- dispatch here
                className="flex flex-col livekit-chat-custom"
            >
                {showVideo && <VideoConference />}
                <div className={showVideo ? "flex-shrink-0" : "flex-1"}>
                    <CustomDataChat topic="lk-chat-topic" />
                </div>
            </LiveKitRoom>
        </RoomContext.Provider>
    );
}
