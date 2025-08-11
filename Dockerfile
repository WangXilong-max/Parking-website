# ---- 1) Build frontend (Vite) ----
FROM node:20.19.0 AS frontend
WORKDIR /app
COPY package*.json ./
# Install dependencies
RUN npm ci

# Build-time envs for Vite - set defaults to ensure map works
ENV VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoid3hsMTIzNzg5IiwiYSI6ImNtZHlid2h1bDAwYmEya3BzMmpvbGFzb2UifQ.PNnx74NZhnHUfa5d1Q_c3w
ENV VITE_BACKEND_URL=

COPY . .
# Build frontend
RUN npm run build

# ---- 2) Install backend deps ----
FROM node:20.19.0-alpine AS backend_deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# ---- 3) Runtime ----
FROM node:20.19.0-alpine
WORKDIR /app
COPY --from=backend_deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY --from=frontend /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "backend/src/server.js"]
