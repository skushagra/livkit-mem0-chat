# AI Chat Agent with LiveKit API and Memory-Enhanced Contextual Conversations

A real-time AI chat agent using the `LiveKit API` that can recall and use previous user interactions by using `mem0` as memory context service system. The agent interacts through chat messages only (no speech-to-text or text-to-speech as of now).

## Features

1. Users join a LiveKit room with chat capabilities enabled (with unique username)
2. An AI chat agent (OpenAI) joins the room as a participant and communicates via text messages.
3. Agent queries `mem0` to retrieve relevant past context of this user on their username.
4. Personalized chat responses leveraging both current input and retrieved memory.
5. Naturally with contextual memory, remembering past user inputs across sessions.
6. The interaction should be real-time and seamless.

## Tech Stack

- LiveKit API for real-time communication.
- OpenAI API for AI chat capabilities.
- mem0 for memory context service.
- Node.js with TypeScript for Livkit agent worker.
- NextJS for frontend UI.
- TailwindCSS for styling.

## Live Video Demo

[https://www.loom.com/share/2a2cf98e66f045b0bd038b392f7045e0?sid=a8a7ab80-46ba-4405-b94c-0ff4b938e943](https://www.loom.com/share/2a2cf98e66f045b0bd038b392f7045e0?sid=a8a7ab80-46ba-4405-b94c-0ff4b938e943)

## Setup Instructions

You can use `pnpm`, `npm`, or `yarn` as your package manager. Below are instructions using `pnpm`.

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd agent-chat-app
   ```

2. Install dependencies for both server and client:

   ```bash
   cd worker
   pnpm install
   cd ..
   cd client
   pnpm install
   ```

3. Set up environment variables:

   Copy the .env.example to .env in both root and client directories and fill in the required values.

4. Start the ui:

   ```bash
    cd client
    pnpm run dev
   ```

5. Start the server:
   ```bash
    cd ..
    cd worker
    pnpm run start:dev
   ```

## Environment Variables

Client (.env):

```bash
# MongoDB Connection String : For creating user chats
MONGODB_URI=

# LiveKit Configuration : For interacting with the LiveKit server
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=
NEXT_PUBLIC_LIVEKIT_URL=
```

Worker (.env):

```bash
# LivKit configuration : For realtime agent sessions across chats
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# Mem0 configuration : For memory management across sessions
MEM0_API_KEY=
MEM0_BASE_URL=

# OpenAI configuration : For text generation and editing
OPENAI_API_KEY=
```
