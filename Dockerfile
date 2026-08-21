# ─── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# ─── Stage 2: Development ─────────────────────────────────────────────────────
FROM base AS development
RUN npm install
COPY . .
EXPOSE 8003
CMD ["npm", "run", "dev"]

# ─── Stage 3: Production ──────────────────────────────────────────────────────
FROM base AS production
COPY . .
EXPOSE 8003
CMD ["npm", "start"]
