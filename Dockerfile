FROM node:18-alpine

WORKDIR /app

# 安裝 curl 用於健康檢查
RUN apk add --no-cache curl

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5002 || exit 1

CMD ["node", "server.js"] 