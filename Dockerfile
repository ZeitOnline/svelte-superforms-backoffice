FROM node:lts AS node
WORKDIR /app
COPY app/.npmrc app/package.json app/package-lock.json ./
RUN npm install
COPY app ./
RUN npm run build
ENTRYPOINT ["node", "build/"]
