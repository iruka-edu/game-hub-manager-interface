# Dùng image Playwright cho Node.js
FROM mcr.microsoft.com/playwright:jammy

# Cài đặt thư viện cần thiết
WORKDIR /app

# Copy package.json và package-lock.json (hoặc pnpm-lock.yaml nếu bạn dùng pnpm)
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Cài đặt các dependencies
RUN npm i --no-audit --no-fund

# Copy toàn bộ mã nguồn vào trong container
COPY . /app

# Biên dịch TypeScript
RUN npm run build

# Cấu hình môi trường
ENV NODE_ENV=production
ENV PORT=8080

# Mở port 8080
EXPOSE 8080

# Chạy server.js sau khi biên dịch
CMD ["node", "dist/server.js"]
