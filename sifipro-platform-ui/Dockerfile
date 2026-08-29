# ─────────────────────────────────────────────────────────────────────────────
#  SIFIPRO Platform UI – React + Vite → nginx
#  Multi-stage build: compila con Node, sirve con nginx (sin Node en producción)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Copiar package files primero para cachear node_modules.
# Si no cambia package.json, npm ci no se vuelve a correr.
COPY package*.json ./
RUN npm ci --silent

# Recibir la URL del API como build argument (mismo nombre que lee el código en
# tiempo de build: import.meta.env.VITE_API_BASE_URL). Vacío por defecto:
# nginx.conf proxea /api/ internamente a platform-api, sin llamadas cross-origin.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copiar todo el código y construir para producción
COPY . .
RUN npm run build

# ── Stage 2: Serve ─────────────────────────────────────────────────────────────
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
