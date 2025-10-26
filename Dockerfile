FROM node:20-slim

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

# Install Playwright system dependencies as root
RUN npx playwright install-deps chromium

# Copy application files
COPY . .

# Verify node_modules exists
RUN ls -la /app && ls -la /app/node_modules | head -20

# Create non-root user and set ownership
RUN chown -R node:node /app
USER node

# Install Playwright browsers as the node user (no system deps needed)
RUN npx playwright install chromium

# Expose port
EXPOSE 8000

# Run application
CMD ["node", "src/index.js"]
