FROM node:22.9.0@sha256:cbe2d5f94110cea9817dd8c5809d05df49b4bd1aac5203f3594d88665ad37988 AS node
WORKDIR /app
COPY app/.npmrc app/package.json app/package-lock.json ./
RUN npm install --force # force is needed because of svelte-5-conflicts
COPY app ./
RUN npm run build
ENTRYPOINT node build/