# 聊天室應用程序

這是一個使用 Node.js、React 和 Socket.IO 構建的即時聊天應用程序。
測試 GitHub Actions 是否會自動執行（2025/05/19）

## 功能特點

- 即時消息傳遞
- AI 聊天機器人
- 多主題對話
- Docker 容器化部署

## 技術棧

- 後端：Node.js, Express, Socket.IO
- 前端：React, Material-UI
- 容器化：Docker, Docker Compose
- CI/CD：GitHub Actions

## 快速開始

1. 克隆倉庫：
   ```bash
   git clone [your-repository-url]
   ```

2. 使用 Docker Compose 運行：
   ```bash
   docker-compose up
   ```

3. 訪問應用：
   - 前端：http://localhost:3000
   - 後端：http://localhost:5002

## 部署

本項目使用 GitHub Actions 進行自動化部署。每次推送到 main 分支時，都會自動：

1. 構建 Docker 映像
2. 推送到 Docker Hub
3. 更新生產環境

## 環境變量

請在運行前設置以下環境變量：

- DOCKER_HUB_USERNAME：Docker Hub 用戶名
- DOCKER_HUB_ACCESS_TOKEN：Docker Hub 訪問令牌

## 開發

本地開發：
```bash
# 後端
npm install
npm start

# 前端
cd client
npm install
npm start
``` 