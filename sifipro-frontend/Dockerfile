# ─────────────────────────────────────────────────────────────────────────────
#  SIFIPRO Frontend – React + Vite → nginx
#  Multi-stage build: compila con Node, sirve con nginx (sin Node en producción)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Copiar package files primero para cachear node_modules.
# Si no cambia package.json, npm ci no se vuelve a correr.
COPY package*.json ./
RUN npm ci --silent

# Recibir la URL del API como build argument.
# Se bake dentro del bundle JS en tiempo de build (comportamiento de Vite).
ARG VITE_API_URL=http://localhost:8085
ENV VITE_API_URL=$VITE_API_URL

# Copiar todo el código y construir para producción
COPY . .
RUN npm run build

# ── Stage 2: Serve ─────────────────────────────────────────────────────────────
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
