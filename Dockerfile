FROM node:18-alpine

WORKDIR /app

# 安裝 curl 用於健康檢查
RUN apk add --no-cache curl

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 5004

# 簡化健康檢查配置
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5004 || exit 1

CMD ["node", "server.js"] 