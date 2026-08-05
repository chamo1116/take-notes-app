FROM node:22-slim

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# node:22-slim already ships a non-root "node" user (uid 1000, home
# /home/node); --with-deps still needs root for the apt-installed browser
# libs, but HOME is pointed at node's home first so the browsers themselves
# land somewhere that user can read later, and outside /app so they're not
# hidden by docker-compose's bind mount over /app at runtime.
ENV HOME=/home/node
RUN pnpm exec playwright install --with-deps chromium

COPY . .

# docker-compose mounts an anonymous volume over /app/.next for the dev
# server's build cache; Docker seeds a fresh anonymous volume from whatever
# already exists at that path in the image, owned by whoever owns it there.
# Without pre-creating it, Docker fills the mountpoint in as root, which the
# non-root user below can't write to.
RUN mkdir -p .next && chown -R node:node /app /home/node

USER node

EXPOSE 3000

CMD ["pnpm", "dev"]
