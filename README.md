# ProjectHub

A Next.js-based project management web app with an integrated AI chatbot powered by a local LLM. Manage your projects, tasks, and notes — and ask the AI assistant anything about them.

## Features

- **Projects** — Create and manage projects with title, description, and visibility settings
- **Tasks** — Create tasks with status, priority, and due dates per project
- **Notes** — Rich notes scoped to each project
- **AI Chat** — Global chatbot with RAG (Retrieval Augmented Generation) across all your projects
- **User Auth** — Secure authentication with per-user project scoping

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS 4 |
| Backend (AI) | FastAPI (Python 3.11) |
| Database | PostgreSQL + pgvector 18 |
| ORM | Prisma 7 |
| LLM | Ollama (local) — Mistral 7B |
| Embeddings | nomic-embed-text (768 dimensions) |
| Containerization | Docker + Docker Compose |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v4.0+)
- [Node.js](https://nodejs.org/) (v18+)
- Git

---

## Getting started

### 1, Clone the repository

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

> **Note:** This step only needs to be done once to set up the local LLM.

    docker compose up -d ollama
    docker compose exec ollama ollama pull nomic-embed-text
    docker compose exec ollama ollama pull mistral:7b

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

    dotenv -e .env.local npx prisma migrate dev

> **Note:** This command will create a new migration file locally so that you can track changes to your database schema in version control. It will also apply the migration to the database running in the Docker container.

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

## How AI Chat works

1. User sends a message to the AI chatbot.
2. The query is embedded using `nomic-embed-text` (768-dim vector)
3. A **cosine similarity search** runs against the `Vector` table, scoped to the authenticated user's projects via a `JOIN` on `ownerId`
4. The top 5 results above a similarity threshold (0.4) are used as context
5. Mistral generates a response using the retrieved context + conversation history
6. The response is **streamed** back token by token to the frontend

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
