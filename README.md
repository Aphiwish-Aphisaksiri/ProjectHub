# ProjectHub

A Next.js-based project management web app with an integrated AI assistant powered by local LLMs via Ollama. Manage your projects, tasks, and notes — and ask the AI anything about them using an agentic tool-calling workflow with RAG.

## Features

- **Projects** — Create and manage projects with title, description, and visibility settings (public/private)
- **Tasks** — Track tasks per project with status, priority, due dates, and assignees via a **drag-and-drop Kanban board** (powered by dnd-kit with optimistic updates)
- **Notes** — Rich notes scoped to each project with full text editing
- **AI Chat** — Agentic AI assistant with tool-calling capabilities, semantic search (RAG), structured data queries, thinking mode, and multi-model support
- **User Auth** — Credentials-based authentication (bcrypt + JWT) with per-user data scoping via NextAuth

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, Server Actions), React 19, Tailwind CSS 4 |
| Backend (AI) | FastAPI (Python 3.11) |
| Database | PostgreSQL 18 + pgvector |
| ORM | Prisma 7 (with `@prisma/adapter-pg`) |
| LLM | Ollama (local) — default: Qwen 3.5 9B (supports any Ollama model) |
| Embeddings | nomic-embed-text (768 dimensions) |
| Containerization | Docker + Docker Compose (with GPU passthrough) |
| Testing | Vitest (frontend), Pytest (backend) |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Docker Compose                                 │
│                                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐   │
│  │   Next.js    │   │   FastAPI    │   │  PostgreSQL  │   │   Ollama    │   │
│  │   :3000      │──>│   :8000      │──>│   :5432      │   │   :11434    │   │
│  │              │   │              │──>│  + pgvector  │   │             │   │
│  │  App Router  │   │  /chat/      │   │              │   │  LLM +      │   │
│  │  API Routes  │   │  /embed/     │   │  Vector      │   │  Embeddings │   │
│  │  Server      │   │  /models/    │   │  Project     │   │             │   │
│  │  Actions     │   │              │   │  Task, Note  │   │             │   │
│  └──────┬───────┘   └──────────────┘   │  User, Chat  │   └─────────────┘   │
│         │                              │  Message     │                     │
│         └────────────────────────────> │  ChatLog     │                     │
│              Prisma ORM (direct)       └──────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data flow:**
- **Next.js** handles all frontend rendering, authentication, and CRUD operations (projects, tasks, notes) directly via Prisma
- **FastAPI backend** handles AI chat, embeddings, and model management — communicates with Ollama for LLM inference and vector generation
- Every time a project, task, or note is created or updated, an **async embedding request** is fired to the FastAPI backend to keep the vector store in sync
- **Ollama** runs locally with GPU acceleration, hosting both the chat model and the embedding model

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v4.0+)
- [Node.js](https://nodejs.org/) (v18+)
- Git

---

## Getting started

### 1. Clone the repository

    git clone https://github.com/yourusername/projecthub.git
    cd projecthub

### 2. Setting up the `.env` file

Create a `.env` file in your project root with the following variables:

    DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@db:5432/<POSTGRES_DB>
    NEXTAUTH_SECRET=<your-secret>
    NEXTAUTH_URL=http://localhost:3000
    POSTGRES_USER=<POSTGRES_USER>
    POSTGRES_PASSWORD=<POSTGRES_PASSWORD>
    POSTGRES_DB=<POSTGRES_DB>
    BACKEND_URL=http://backend:8000

Create a `.env.local` file in your project root with the following variables:

    DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@localhost:5432/<POSTGRES_DB>
    NEXTAUTH_SECRET=<your-secret>
    NEXTAUTH_URL=http://localhost:3000
    POSTGRES_USER=<POSTGRES_USER>
    POSTGRES_PASSWORD=<POSTGRES_PASSWORD>
    POSTGRES_DB=<POSTGRES_DB>
    BACKEND_URL=http://localhost:8000

- **NEXTAUTH_SECRET:** Generate a secure secret with:

    openssl rand -hex 32

Or use any random 32-character string.

- **NEXTAUTH_URL:** Should match your app’s URL (usually `http://localhost:3000` for local development).

Replace `<POSTGRES_USER>`, `<POSTGRES_PASSWORD>`, and `<POSTGRES_DB>` with your values.

### 3. Initialize Database

> **Note 1:** This step only needs to be done once to set up the database.
> **Note 2:** To update the database schema after making changes to your Prisma models, refer to the [Database Migrations](#database-migrations) section.

    docker compose up -d db
    docker compose up migrate

### 4. Initialize Ollama

> **Note:** This step only needs to be done once to set up the local LLM. You can pull any model supported by Ollama — the chat UI lets you switch between all installed models at runtime.

    docker compose up -d ollama
    docker compose exec ollama ollama pull nomic-embed-text
    docker compose exec ollama ollama pull qwen3.5:9b

### 5. Run backend server

    docker compose up -d backend

### 6. Run the containerized web app in development mode with hot reloading

    docker compose up --watch dev

> **Note 1:** Once the development server is running, you can access the web app at `http://localhost:3000`. Any changes you make to the code will automatically trigger a rebuild and refresh the app in the browser.
> **Note 2:** Once detached from the terminal, the server will continue running but **hot reloading will be disabled**

### 7. Run the containerized web app in production mode

    docker compose up prod

### 8. Stop all containers

    docker compose down

---

## GPU Passthrough (NVIDIA on Windows 11)

> **Requirements:** NVIDIA GPU, Windows 11, Docker Desktop with WSL2 backend

### Step 1: Update NVIDIA Drivers

Make sure you have the latest NVIDIA drivers installed that support WSL2 GPU passthrough. You can download them from the [NVIDIA website](https://www.nvidia.com/Download/index.aspx).

### Step 2: Install NVIDIA Container Toolkit in WSL2

open **WSL2 Ubuntu terminal** and run:

    # Add NVIDIA package repository
    curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

    curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

    # Install the toolkit
    sudo apt-get update
    sudo apt-get install -y nvidia-container-toolkit
    sudo nvidia-ctk runtime configure --runtime=docker
    sudo systemctl restart docker

### Step 3: Verify GPU Access

on **WSL2 Ubuntu terminal**, run:
    nvidia-smi

---

You should see your GPU listed.

## Database Migrations

To apply database migrations, run the following command:

    npx dotenv-cli -e .env.local npx prisma migrate dev

> **Note:** This command will create a new migration file locally so that you can track changes to your database schema in version control. It will also apply the migration to the database running in the Docker container. DO NOT RUN MIGRATION INSIDE THE CONTAINER, THE DATABASE WILL BE OUT OF SYNC.

---

## Monitor the Database

You can monitor and manage your database in two ways:

### 1. Using Prisma Studio

Run the following command in your terminal:

    docker compose exec dev npx prisma studio --browser none

Then open [http://localhost:51212](http://localhost:51212) in your browser to access Prisma Studio.

### 2. Using pgAdmin

You can connect to the database directly with pgAdmin using:

- Host: `localhost`
- Port: `5432`
- User: (as set in your `.env`, e.g. `postgres`)
- Password: (as set in your `.env`)
- Database: (as set in your `.env`, e.g. `projecthub`)

---

## How the AI Assistant Works

The AI assistant uses a **dual-path architecture** that adapts based on the selected model's capabilities.

### Embedding Pipeline

Every time a user creates or updates a project, task, or note, the Next.js server action fires a **non-blocking request** to the FastAPI backend (`/embed/project`, `/embed/task`, `/embed/note`). The backend:

1. Chunks the text content (word-based, 400 tokens per chunk with 50-token overlap)
2. Generates a 768-dimensional embedding via `nomic-embed-text`
3. Stores the embedding in the `Vector` table (PostgreSQL + pgvector)

This keeps the vector store in sync with the latest user data without blocking the UI.

### Chat Flow Overview

```
User sends message
        │
        ▼
┌───────────────────────┐
│  Does the model       │
│  support tool-calling │
│  (e.g. Qwen 3.5)?     │
└───────────────────────┘
    Yes            No
    ▼              ▼
┌───────────┐  ┌───────────────┐
│ Agentic   │  │ RAG Fallback  │
│ Tool Loop │  │ Path          │
└────────┬──┘  └───────┬───────┘
         │             │
         ▼             ▼
     Stream final answer
     token by token
```

### Path 1: Agentic Tool-Calling Loop (Tool-Capable Models)

When the selected model supports native tool-calling (e.g., Qwen 3.5), the assistant operates as an **agent** that decides which tools to invoke:

1. The user's message + conversation history (last 10 messages) is sent to the LLM with a system prompt and **two tool schemas**
2. The LLM decides whether to call a tool (or answer directly if no data lookup is needed)
3. If a tool is called, the result is appended to the conversation and the LLM is called again
4. This loop repeats up to **5 iterations** — the LLM can chain multiple tool calls to gather sufficient context
5. Once the LLM has enough context, it generates a final answer which is **streamed** token by token

**Available tools:**

| Tool | Purpose | When the LLM uses it |
|---|---|---|
| `search_project_data` | Semantic vector search across the user's projects, tasks, and notes using cosine similarity | Vague, conceptual, or natural-language questions about project content |
| `query_structured_data` | Direct SQL queries for exact data (task counts, status/priority filters, project metadata, notes listing) | Precise, structured questions like "how many tasks are in progress?" |

**`query_structured_data` supported intents:**
- `list_tasks_by_status` — Filter tasks by status and/or priority
- `list_tasks_by_priority` — Filter tasks by priority
- `count_tasks` — Count tasks matching filters
- `get_project_details` — Get project metadata with task/note counts
- `get_notes_for_project` — List notes for a specific project

### Path 2: RAG Fallback (Non-Tool Models)

When the model doesn't support tool-calling (e.g., Mistral, Llama 3.1), the system falls back to a traditional RAG pipeline:

1. The LLM first extracts an optimized **semantic search query** from the user's message + history (max 18 words)
2. The query is embedded using `nomic-embed-text`
3. A **cosine similarity search** runs against the `Vector` table, scoped to the user's projects
4. Results above the similarity threshold (0.4) are injected as context into the system prompt
5. The LLM generates a response using the context — streamed token by token

### Project Scoping

Both paths use **automatic project scoping**. Before running a vector search, the system analyzes the user's query to detect if it mentions a specific project by name. It uses a combination of:

- Substring matching (e.g., "fitflow" matches "FitFlow Virtual Yoga Instructor")
- Token overlap scoring
- Sequence matching ratio
- Disambiguation (requires a clear gap between top-2 matches)

If a project is confidently identified (score ≥ 0.72 with sufficient gap), the vector search is scoped to that project only, improving relevance.

### Thinking Mode

Models that support extended thinking (e.g., Qwen 3.5) can be toggled into **thinking mode** from the chat UI. When enabled:

- The LLM generates a "thinking scratchpad" before its response
- Thinking tokens are streamed to the frontend and displayed in a collapsible block
- If thinking mode fails (e.g., the model doesn't actually support it), the system **automatically retries without thinking** and shows a notice to the user

Thinking support is detected per-model and surfaced in the model selector UI.

### Model Capability Detection

The backend dynamically detects each model's capabilities:

- **Tool-calling support** — Queried via Ollama's `/api/show` endpoint (checks for `"tools"` in capabilities), with a **blocklist** for models that declare tools support but use incompatible chat templates (e.g., Mistral)
- **Thinking support** — Determined by model name prefix (blocklisted: `mistral`, `llama3.1`)
- Results are **cached per model** to avoid repeated API calls

### Streaming Protocol

Responses are streamed using a custom sentinel-based protocol over `text/plain`. Frames are delimited by `\x1e` (ASCII Record Separator):

| Sentinel | Purpose |
|---|---|
| `__THINKING__` | Thinking tokens from the LLM's scratchpad |
| `__TOOLCALL__` | Tool call indicator (name + args) — displayed to the user as a live "Searching..." indicator |
| `__NOTICE__` | System notices (e.g., thinking mode fallback) |
| `__METRICS__` | Final chunk with performance metrics (tokens/sec, prompt tokens, completion tokens, duration) |
| *(plain text)* | Content tokens — streamed verbatim |

### Chat Logging

Every completed chat interaction is logged to the `ChatLog` table with:

- Query text and extracted/summarized query
- Context sources and similarity scores
- Token counts (prompt, completion, thinking)
- Performance metrics (duration, tokens/sec)
- Model name and whether thinking was enabled

---

## Common Issues & Troubleshooting

**`Already in sync, no schema change found` when running migrate dev**
Your `schema.prisma` inside the container is stale. Make sure your `docker-compose.yml` has a `sync` watch action on `prisma/schema.prisma`, or run the migration locally using `.env.local`.

**`prisma.task is undefined`**
Run `npx prisma generate` then restart the dev container — the client needs to be regenerated after schema changes.

---

## Design Notes

### Color Scheme

    Primary: #061E29
    Secondary: #1D546D
    Tertiary: #5F9598
    Quaternary: #F3F4F4
    White: #F0F6FC
    Off black: #0A1B2A
    Light Grey: #BABABA
    Green: #208F0A
    Red: #8F0A0A

### Ports

    Frontend: 3000
    Backend: 8000
    Database: 5432
    Ollama: 11434
