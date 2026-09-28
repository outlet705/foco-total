# Imagem com Node.js + instalação do FFmpeg via apt (necessário para o
# processamento real de vídeo). Faz build do frontend e roda o backend,
# que serve o frontend já buildado na mesma porta (ver backend/src/server.js).

FROM node:20-bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY backend ./backend
COPY frontend ./frontend

RUN cd frontend && npm run build

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "backend/src/server.js"]
