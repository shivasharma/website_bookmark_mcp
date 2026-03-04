FROM node:20-alpine

# We build from the **repo root** as context.
# This Dockerfile should be used with:
#   docker build -t bookmark-app -f server/Dockerfile .

WORKDIR /app

# Install dependencies from root package.json/package-lock.json
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy only what the container needs
COPY server ./server
COPY dashboard ./dashboard

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["node", "dist/api.js"]
