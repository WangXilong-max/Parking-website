# ---- 1) Build frontend (Vite) ----
FROM node:20.19.0-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
# build args for Vite (either name)
ARG VITE_MAPBOX_TOKEN
ARG VITE_MAPBOX_ACCESS_TOKEN
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_ACCESS_TOKEN=$VITE_MAPBOX_ACCESS_TOKEN

COPY . .
RUN npm run build

# ---- 2) Install backend deps ----
FROM node:20.19.0-alpine AS backend_deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# ---- 3) Runtime ----
FROM node:20.19.0-alpine
WORKDIR /app
# backend code + deps
COPY --from=backend_deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
# built frontend to /app/dist (served by Express)
COPY --from=frontend /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "backend/src/server.js"]
