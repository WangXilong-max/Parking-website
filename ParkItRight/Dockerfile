# ---- build frontend ----
FROM node:20.19.0-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- install backend deps ----
FROM node:20.19.0-alpine AS backend_deps
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# ---- runtime ----
FROM node:20.19.0-alpine
WORKDIR /app
# backend code + deps
COPY --from=backend_deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
# built frontend
COPY --from=frontend /app/dist ./dist

ENV NODE_ENV=production
EXPOSE
