FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
ENV NEXT_PUBLIC_API_URL=
ENV BACKEND_URL=http://backend:3000
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

USER nextjs

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["node_modules/.bin/next", "start", "-p", "4000"]
