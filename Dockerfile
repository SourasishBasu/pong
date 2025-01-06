# Use the official Node.js image as the base image
FROM node:22-slim

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd backend && npm install --only=production

# Copy the backend and frontend code to the container
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start", "--prefix", "backend"]