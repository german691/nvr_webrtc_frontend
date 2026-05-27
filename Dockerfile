# --- ETAPA 1: Compilación ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias (para aprovechar la caché de capas de Docker)
COPY package*.json ./

# Instalar dependencias utilizando npm ci optimizado (sin auditorías de seguridad y sin barras de progreso lentas)
RUN npm ci --prefer-offline --no-audit --progress=false

# Copiar el resto del código (excluye node_modules gracias a .dockerignore)
COPY . .

# Inyectar la variable de entorno con la ruta relativa del API (/api) para producción
RUN echo "VITE_API_URL=/api" > .env

# Compilar estáticos de la aplicación
RUN npm run build

# --- ETAPA 2: Servidor Nginx de Producción ---
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx para servir estáticos y actuar de Proxy Inverso
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los estáticos de React compilados en la Etapa 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx corre internamente en el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
