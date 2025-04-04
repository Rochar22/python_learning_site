# Этап сборки
FROM node:18 AS builder

WORKDIR /app

# 1. Копируем только файлы зависимостей
COPY package.json package-lock.json ./

# 2. Устанавливаем зависимости (для Next.js важно использовать npm ci)
RUN npm ci --legacy-peer-deps

# 3. Копируем остальные файлы
COPY . .

# 4. Сборка проекта (Next.js требует env-переменные во время сборки)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Этап выполнения
FROM node:18 AS runner

WORKDIR /app

# Копируем только необходимое
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

# Указываем порт (по умолчанию Next.js использует 3000)
EXPOSE 3000

# Запускаем в production режиме
CMD ["npm", "start"]