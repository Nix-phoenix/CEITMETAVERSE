FROM node:20-bookworm-slim

# Prisma engines need OpenSSL at runtime
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the whole repo (WebPage + uploads + Script) so sever.js can
# resolve its static paths (path.join(__dirname, '../../...'))
COPY . .

WORKDIR /app/Script/DataBase
RUN npm ci --omit=dev \
 && npx prisma generate --schema=./prisma/schema.prisma

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Apply pending migrations then start the API/static server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma; node sever.js"]
