FROM node:18-alpine

WORKDIR /app

# Install build dependencies for npm modules
RUN apk add --no-cache python3 make g++ bash

# Copy package.json first for faster rebuilds
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose dev server port
EXPOSE 3000

# Start dev server
CMD ["npm", "start"]
