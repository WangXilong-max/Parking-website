# ---- 1) Build frontend (Vite) ----
FROM node:20.19.0-alpine AS frontend
WORKDIR /app
# copy root manifests from subdir for caching
COPY PARKING-WEBSITE/package*.json ./
RUN npm ci
# build-time Vite envs
ARG VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
# copy source and build
COPY PARKING-WEBSITE ./
RUN npm run build

# ---- 2) Install backend deps ----
FROM node:20.19.0-alpine AS backend_deps
WORKDIR /app/backend
COPY PARKING-WEBSITE/backend/package*.json ./
RUN npm ci --omit=dev

# ---- 3) Runtime ----
FROM node:20.19.0-alpine
WORKDIR /app
# backend source + deps
COPY --from=backend_deps /app/backend/node_modules ./backend/node_modules
COPY PARKING-WEBSITE/backend ./backend
# built frontend for serving
COPY --from=frontend /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "backend/src/server.js"]
