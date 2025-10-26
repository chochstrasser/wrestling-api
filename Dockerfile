FROM node:18-slim

WORKDIR /app

# Enable Corepack for Yarn version management
RUN corepack enable

# Install dependencies
COPY package.json yarn.lock* package-lock.json* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

# Install Playwright dependencies (optional, for scraping)
# RUN npx playwright install-deps chromium

# Copy application
COPY . .

# Create non-root user (use node user that comes with the image)
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 8000

# Run application
CMD ["node", "src/index.js"]
