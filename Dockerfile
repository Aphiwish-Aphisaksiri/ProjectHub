# Development image
FROM node:20 AS dev
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy all other files
COPY . .

# Expose port 3000
EXPOSE 3000

# Start Next.js dev server
CMD ["npm", "run", "dev"]

# Use official Node.js image as base
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy all other files
COPY . .

# Build ARG for DATABASE_URL, default to dummy
ARG DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb"
ENV DATABASE_URL=${DATABASE_URL}

# Build Next.js app
RUN npm run build

# Production image
FROM node:20 AS production
WORKDIR /app

# Copy package.json for production
COPY package.json ./

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Expose port 3000
EXPOSE 3000

# Start Next.js app
CMD ["npm", "start"]
