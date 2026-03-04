FROM node:20-alpine

# We build from the **repo root** as context.
# This Dockerfile should be used with:
#   docker build -t bookmark-app -f server/Dockerfile .

WORKDIR /app

# Install dependencies from root package.json/package-lock.json
COPY package*.json ./
RUN npm install --production

# Copy only what the container needs
COPY server ./server
COPY dashboard ./dashboard

# Run the API from the server folder
WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "api.js"]