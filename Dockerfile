FROM node:22-alpine AS dependencies

WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:22-alpine AS build

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN addgroup -S nexus && adduser -S nexus -G nexus

COPY --from=build --chown=nexus:nexus /app/package.json ./package.json
COPY --from=build --chown=nexus:nexus /app/node_modules ./node_modules
COPY --from=build --chown=nexus:nexus /app/.next ./.next
RUN npm prune --omit=dev

USER nexus
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["npm", "start"]
