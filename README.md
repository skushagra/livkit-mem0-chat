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
- Node.js with TypeScript for Livekit agent worker.
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

The above environment variables are essential for the application to function correctly. Ensure you have valid keys and URLs for each service.

## Design Overview

The repo contains two main parts:

1. **Client**: A NextJS frontend that allows users to join a LiveKit room with chat capabilities. Users can send and receive messages in real-time.
2. **Worker**: A Node.js server that acts as the AI chat agent. It connects to the LiveKit room, listens for chat messages, retrieves relevant memory from `mem0`, and responds using the OpenAI API.

### Client

This is pretty straightforward. I used the LiveKit React SDK to create a simple UI where users can join a room with a unique username and send/receive chat messages.

### Worker

- I decided to use a node.js + typescript worker for registering the agent with LiveKit and handling the chat messages. Mainly because I could find more resources and examples for using LiveKit with Node.js.
- I looked at multiple examples from LiveKit docs and github repos to understand how to connect to a room, listen for chat messages, and send messages.
- I took inspiration from the following resources:
  - [LiveKit Next.js Voice AI Starter](https://github.com/livekit-examples/agent-starter-react)
  - [LiveKit and Next.js Meeting room](https://github.com/livekit-examples/meet)

I later checked out the LiveKit docs for more examples of codebases using Python like:

- https://github.com/livekit-examples/agent-starter-python
- https://github.com/livekit-examples/multimodal-agent-python

Although my code in typescript was pretty mature by then, so I decided to stick with it.

#### Key Components of the Worker

- **LiveKit Client**: In `index.ts`, it defined the flow of the agent joining the room, listening for messages, and responding.
- **Mem0 Integration**: When a message is received, the agent queries `mem0` to fetch relevant past interactions based on the username. Any serviced implementing the IMemoryService interface can be used here. Currently using Mem0MemoryService.
- **OpenAI Integration**: The agent uses the OpenAI API to generate responses, incorporating both the current message and the retrieved memory context. Any service implementing the IAIService interface can be used here. Currently using OpenAIService.
- **Message Handling**: The agent processes incoming messages, retrieves memory, generates a response, and sends it back to the room. This is the encoder and decoder of the chat system, for correct activation of the RoomEvent.DataReceived event and also sending messages back to the room.

#### Message Flow

1. User sends a chat message in the LiveKit room.
2. The worker (AI agent) receives the message via the `RoomEvent.DataReceived`
3. The agent queries `mem0` for relevant past context using the username.
4. The agent combines the current message and retrieved memory to generate a response using OpenAI.
5. The agent sends the response back to the LiveKit room as a chat message.
6. The user sees the AI agent's response in real-time.

#### Memory Management

- The `Mem0MemoryService` class handles interactions with the `mem0` API.
- It stores user messages and retrieves relevant past interactions based on the username.
- This allows the agent to maintain context across sessions and provide personalized responses.

#### AI Service

- The `OpenAIService` class manages interactions with the OpenAI API.
- It sends prompts to OpenAI and receives generated responses.
- This abstraction allows for easy swapping of AI providers if needed.

## Future Improvements

- This is a POC kind of application, we can refine it more to further improve accuracy and performance.
- Add error handling and retries for API calls.

> P.S. : Accidentally left the `e` in `livekit-mem0-chat` out of the repo name. Later thought it's okay! 😅
