# Prod Dockerfile: Multi-stage build
# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Use Taobao registry for faster npm installs in China
RUN npm config set registry https://registry.npmmirror.com/

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN apk add --no-cache bash

WORKDIR /usr/share/nginx/html

# Clean default nginx html files
RUN rm -rf ./*

# Copy from builder
COPY --from=builder /app/dist .

COPY deploy/ecommerce-nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
