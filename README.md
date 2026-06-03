# Cross-Platform Content Analyzer & RAG Chat

This backend powers a cross-platform analytics dashboard that compares the performance, transcripts, and metadata of YouTube videos and Instagram Reels side-by-side. 

More importantly, it features a multi-tenant RAG (Retrieval-Augmented Generation) chatbot. Once a pair of videos is analyzed, users can chat directly with the video data to uncover insights, compare engagement strategies, and analyze transcripts using Google Gemini.

## 🏗 Architecture & Core Features

I built this with a focus on speed, API resilience, and strict session isolation so multiple users can query the database simultaneously without data bleed.

* **Parallel Fetching Pipeline:** The `/analyze` route resolves YouTube Data (official API), Instagram Data (RapidAPI proxy), and Transcripts concurrently to minimize TTFB (Time to First Byte).
* **Local Vector Embeddings:** Instead of paying for OpenAI embeddings, the backend runs `Xenova/all-MiniLM-L6-v2` entirely locally via `@xenova/transformers` (isolated in Node.js Worker Threads) to generate vectors for the transcripts without blocking the main event loop.
* **Multi-Tenant Vector Storage:** Uses **Qdrant**. Every analysis generates a unique `sessionId` which is injected into the vector metadata. A Qdrant Payload Index ensures lightning-fast retrieval locked specifically to the user's active session.
* **Context-Aware RAG:** Powered by `gemini-2.5-flash` and LangChain. 
* **Stateful Chat Memory:** Uses **Upstash Redis** to remember the last 10 interactions per `sessionId` (with a 24-hour TTL) so the chatbot feels conversational without blowing up the LLM token context window.

## 💻 Tech Stack

* **Framework:** Node.js + Express
* **Real-time & Queues:** Socket.io, BullMQ
* **LLM Orchestration:** LangChain (`@langchain/google-genai`, `@langchain/qdrant`)
* **Embeddings:** HuggingFace Transformers (`@xenova/transformers`)
* **Vector Database:** Qdrant Cloud
* **Cache & Session Memory:** Upstash Redis (`ioredis`, `@upstash/redis`)
* **External APIs:** Google YouTube Data API v3, RapidAPI (Instagram + YT Transcripts)

## 🚀 How It Works Under the Hood

### 1. The Analysis Flow (`POST /api/analyze`)
When a user submits two URLs:
1.  Generates a unique `sessionId`.
2.  Fetches primary metadata and transcripts concurrently.
3.  Dispatches background jobs (BullMQ) for heavy/flaky tasks (e.g., Instagram follower lookups).
4.  Chunks the transcript text (1500 chars, 150 overlap).
5.  Vectorizes the chunks locally using Xenova worker threads.
6.  Pushes the vectors to Qdrant, tagged with the `sessionId` and payload indexed.
7.  Returns the structured metadata and the `sessionId` to the React frontend instantly.
8.  *WebSocket (`socket.io`)* pushes any delayed metadata updates to the frontend once BullMQ finishes.

### 2. The Chat Flow (`POST /api/chat`)
When a user asks a question:
1.  Validates the `sessionId`.
2.  Embeds the user's question.
3.  Queries Qdrant for the top 20 most relevant chunks, strictly filtered by the `sessionId`.
4.  Pulls the previous chat history from Upstash Redis.
5.  Injects the history, retrieved context, and metadata into a highly structured prompt.
6.  Generates an answer using `gemini-2.5-flash` and updates the Redis cache.

## 🔑 Environment Variables

To run this locally, create a `.env` file in the root of the `backend` directory. You will need keys for all external services:

```env
# Server
PORT=5000

# Third-Party APIs
YOUTUBE_API_KEY="your_google_cloud_youtube_key"
RAPIDAPI_KEY="your_rapidapi_key"

# AI & Embeddings
GEMINI_API_KEY="your_google_ai_studio_key"

# Vector Database (Qdrant)
QDRANT_URL="[https://your-cluster-url.qdrant.io:6333](https://your-cluster-url.qdrant.io:6333)"
QDRANT_API_KEY="your_qdrant_api_key"

# Redis Config (Upstash)
# REST API is for LangChain memory/chat history
UPSTASH_REDIS_REST_URL="[https://your-upstash-endpoint.upstash.io](https://your-upstash-endpoint.upstash.io)"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token"
# TCP URL is for BullMQ Background Workers (must use rediss://)
UPSTASH_REDIS_URL="rediss://default:your-password@your-endpoint.upstash.io:32451"

## 🛠 Local Setup

1. **Install dependencies:**
   ```bash
   npm install
