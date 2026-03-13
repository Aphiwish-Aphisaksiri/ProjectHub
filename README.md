# ProjectHub

## Running the webapp with Docker

### Setting up the `.env` file

Create a `.env` file in your project root with the following variables:

    DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@db:5432/<POSTGRES_DB>
    NEXTAUTH_SECRET=<your-secret>
    NEXTAUTH_URL=http://localhost:3000
    POSTGRES_USER=<POSTGRES_USER>
    POSTGRES_PASSWORD=<POSTGRES_PASSWORD>
    POSTGRES_DB=<POSTGRES_DB>

Create a `.env.local` file in your project root with the following variables:

    DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@localhost:5432/<POSTGRES_DB>
    NEXTAUTH_SECRET=<your-secret>
    NEXTAUTH_URL=http://localhost:3000
    POSTGRES_USER=<POSTGRES_USER>
    POSTGRES_PASSWORD=<POSTGRES_PASSWORD>
    POSTGRES_DB=<POSTGRES_DB>

- **NEXTAUTH_SECRET:** Generate a secure secret with:

    openssl rand -hex 32

Or use any random 32-character string.

- **NEXTAUTH_URL:** Should match your app’s URL (usually `http://localhost:3000` for local development).

Replace `<POSTGRES_USER>`, `<POSTGRES_PASSWORD>`, and `<POSTGRES_DB>` with your desired values.

### Initialize Database

> **Note 1:** This step only needs to be done once to set up the database.
> **Note 2:** To update the database schema after making changes to your Prisma models, refer to the [Database Migrations](#database-migrations) section.

    docker compose up -d db
    docker compose up migrate

### Run the containerized web app in development mode with hot reloading

    docker compose up --watch dev

> **Note 1:** Once the development server is running, you can access the web app at `http://localhost:3000`. Any changes you make to the code will automatically trigger a rebuild and refresh the app in the browser.
> **Note 2:** Once detached from the terminal, the server will continue running but **hot reloading will be disabled**

### Run the containerized web app in production mode

    docker compose up prod

### Stop all containers

    docker compose down

---

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

## Backend

    docker compose up ollama
    docker compose up backend

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
