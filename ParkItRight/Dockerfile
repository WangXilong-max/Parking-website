# ---- build frontend ----
FROM node:20.19.0-alpine AS frontend
WORKDIR /app
# cache deps
COPY package*.json ./
RUN npm ci
# build frontend
COPY . .
RUN npm run build

# ---- install backend ----
FROM node:20.19.0-alpine AS backend_deps
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# ---- runtime ----
FROM node:20.19.0-alpine
WORKDIR /app

# 1) backend source + deps
COPY --from=backend_deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

# 2) built frontend -> serve from backend
COPY --from=frontend /app/dist ./dist

# env (Railway provides PORT automatically)
ENV NODE_ENV=production

# (optional) expose for local runs; Railway uses $PORT regardless
EXPOSE 3001

# IMPORTANT: your server must serve ../dist and listen on 0.0.0.0:$PORT
CMD ["node", "backend/src/server.js"]
