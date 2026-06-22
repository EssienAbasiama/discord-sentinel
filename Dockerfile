# ---- Build stage: compile native deps + build the React client ----
FROM node:20-bookworm AS build
WORKDIR /app

# Install server dependencies (compiles the better-sqlite3 native binary).
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Install client dev deps (vite etc.) and build the frontend.
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install
COPY . .
RUN cd client && npm run build

# ---- Runtime stage: slim image with only what's needed to run ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

# Carry over compiled deps + app code from the build stage.
# (build and runtime share the same Debian base, so the better-sqlite3
#  native binary is compatible.)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/server ./server
COPY --from=build /app/package.json ./package.json

# SQLite lives here; the Fly volume mounts at /app/data so it persists.
RUN mkdir -p /app/data

EXPOSE 8080
CMD ["node", "server/index.js"]
