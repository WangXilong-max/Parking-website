# ---- 1) Build frontend (Vite) ----
FROM node:20.19.0 AS frontend
WORKDIR /app
COPY package*.json ./
# Clear npm cache and install dependencies with force flag to handle optional deps
RUN npm cache clean --force
RUN rm -rf node_modules package-lock.json
RUN npm install --force

# Build-time envs for Vite (support either var name)
ARG VITE_MAPBOX_TOKEN
ARG VITE_MAPBOX_ACCESS_TOKEN
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_ACCESS_TOKEN=$VITE_MAPBOX_ACCESS_TOKEN

COPY . .
COPY .env.production .env
# Ensure all optional dependencies are available before build
RUN npm rebuild
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
