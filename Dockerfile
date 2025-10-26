FROM node:18-slim

WORKDIR /app

# Install Python and build tools for native dependencies (sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Enable Corepack for Yarn version management
RUN corepack enable

# Copy package files
COPY package.json yarn.lock* package-lock.json* .yarnrc.yml* ./

# Install dependencies
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

# Install Playwright dependencies for scraping
RUN npx playwright install --with-deps chromium

# Copy application files
COPY . .

# Verify node_modules exists
RUN ls -la /app && ls -la /app/node_modules | head -20

# Create non-root user (use node user that comes with the image)
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 8000

# Run application
CMD ["node", "src/index.js"]
