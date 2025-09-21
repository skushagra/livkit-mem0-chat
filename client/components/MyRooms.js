import {
  Chat,
  LiveKitRoom,
  formatChatMessageLinks,
  RoomContext,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Room, RoomEvent } from "livekit-client";
import getAccessToken from "./lib/auth";

import { useCallback, useEffect, useMemo, useState } from "react";

function MyRoom() {
  const [token, setToken] = useState("");

  useEffect(() => {
    if (window.location.pathname !== "/") {
      window.location.replace("/");
    }
  }, []);
  const handleOnLeave = useCallback(() => {
    window.location.replace("/");
  }, []);
  const handleError = useCallback((error) => {
    console.error(error);
    alert(
      `Encountered an unexpected error, check the console logs for details: ${error.message}`
    );
  }, []);

  const room = useMemo(() => new Room(), []);

  useEffect(() => {
    async function connect() {
      const token = await getAccessToken(
        "my-room",
        "user-" + Math.floor(Math.random() * 1000)
      );
      setToken(token);
      // await room.connect("wss://attackchat-iitd0rzu.livekit.cloud", token, {
      //   autoSubscribe: true,
      //   publishDefaults: {
      //     video: true,
      //     audio: true,
      //   },
      // });
    }
    connect();
  }, [room]);

  useEffect(() => {
    room.on(RoomEvent.Disconnected, handleOnLeave);
    room.on(RoomEvent.MediaDevicesError, handleError);

    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [handleError, handleOnLeave, room]);

  return (
    <RoomContext.Provider value={room}>
      {token && (
        <LiveKitRoom
          style={{ height: "100vh", width: "100%", padding: 0, margin: 0 }}
          data-lk-theme="default"
          token={token}
          serverUrl={"wss://attackchat-iitd0rzu.livekit.cloud"}
        >
          <Chat />
        </LiveKitRoom>
      )}
    </RoomContext.Provider>
  );
}

export default MyRoom;
