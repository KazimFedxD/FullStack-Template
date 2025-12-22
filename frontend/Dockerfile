FROM node:22-alpine

WORKDIR /app

# Install build dependencies for npm modules
RUN apk add --no-cache python3 make g++ bash

# Copy package.json first for faster rebuilds
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

