FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install --production

# Copy server code and dashboard
COPY . .
COPY ../dashboard ./dashboard

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "api.js"]