# 1. Imagen base de Node.js
FROM node:18-alpine

# 2. Crear directorio de trabajo
WORKDIR /app

# 3. Copiar backend
COPY backend/ ./backend/

# 4. Instalar dependencias
WORKDIR /app/backend
RUN npm install

# 5. Copiar frontend Flutter ya compilado (corregido)
COPY frontend/web/ ./frontend/web/

# 6. Exponer puerto
EXPOSE 8080

# 7. Comando para correr Node
CMD ["node", "server.js"]
