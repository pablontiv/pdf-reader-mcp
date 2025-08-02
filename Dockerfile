FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose the port (if needed for HTTP transport)
EXPOSE 3000

# Run the server
CMD ["npm", "start"]