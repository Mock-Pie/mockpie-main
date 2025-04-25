# Use official Node.js image
FROM --platform=linux/arm64 node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

CMD ["npm", "start", "--", "--host=0.0.0.0"]