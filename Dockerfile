FROM node:22-alpine

WORKDIR /app

# Install dependencies first (cached layer unless package files change)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
