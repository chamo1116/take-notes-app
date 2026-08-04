FROM node:22-slim

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

RUN pnpm exec playwright install --with-deps chromium

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
