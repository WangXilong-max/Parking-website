# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# copy manifests
COPY package*.json ./
COPY backend/package*.json ./backend/

# install deps
RUN npm ci
WORKDIR /app/backend
RUN npm ci

# copy source
WORKDIR /app
COPY . .

# build frontend (writes /app/dist)
# Vite will read env at build time. Set VITE_* vars in Railway.
RUN npm run build

# ---------- runtime stage ----------
FROM node:20-alpine
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

# copy backend and built frontend
COPY --from=build /app/backend ./backend
COPY --from=build /app/dist ./dist

EXPOSE 3000
WORKDIR /app/backend
CMD ["node", "src/server.js"]
