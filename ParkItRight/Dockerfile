# ---- 1) Build frontend (Vite) ----
FROM node:20.19.0-alpine AS frontend
WORKDIR /app
# copy only root manifests first for better cache
COPY package*.json ./
RUN npm install            # use npm ci later when locks are fixed
# Build-time envs for Vite (Railway usually passes env to build; this is an extra safety net)
ARG VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
# now copy source and build
COPY . .
RUN npm run build

# ---- 2) Install backend deps ----
FROM node:20.19.0-alpine AS backend_deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev  # use npm ci --omit=dev later when backend lock is clean

# ---- 3) Runtime image ----
FROM node:20.19.0-alpine
WORKDIR /app

# backend code + node_modules
COPY --from=backend_deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

# built frontend to /app/dist (served by Express)
COPY --from=frontend /app/dist ./dist

ENV NODE_ENV=production
# Railway injects PORT; EXPOSE is for local runs
EXPOSE 3001

# Start backend (which must serve ../dist and listen on 0.0.0.0:$PORT)
CMD ["node", "backend/src/server.js"]
