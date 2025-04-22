# Use official Node.js image
FROM node:18

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js app
RUN npm run build
RUN npm run dev

# Command to start the app
CMD ["npm", "start"]