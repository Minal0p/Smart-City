#!/bin/bash

# Smart City BMS Deployment Script
# This script helps deploy the application to Cloudflare Pages

set -e

echo "🚀 Starting Smart City BMS deployment..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in
if ! npx wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run 'wrangler login' first."
    exit 1
fi

# Create D1 database if it doesn't exist
echo "📊 Setting up D1 database..."
if ! npx wrangler d1 list | grep -q "smart-city-db"; then
    echo "Creating D1 database..."
    npx wrangler d1 create smart-city-db
else
    echo "✅ D1 database already exists"
fi

# Create KV namespace if it doesn't exist
echo "💾 Setting up KV namespace..."
if ! npx wrangler kv:namespace list | grep -q "smart-city-cache"; then
    echo "Creating KV namespace..."
    npx wrangler kv:namespace create smart-city-cache
    npx wrangler kv:namespace create smart-city-cache --preview
else
    echo "✅ KV namespace already exists"
fi

# Create R2 bucket if it doesn't exist
echo "🗂️ Setting up R2 storage..."
if ! npx wrangler r2 bucket list | grep -q "smart-city-storage"; then
    echo "Creating R2 bucket..."
    npx wrangler r2 bucket create smart-city-storage
else
    echo "✅ R2 bucket already exists"
fi

# Build the application
echo "🏗️ Building application..."
npm run build

# Apply database migrations
echo "🔄 Applying database migrations..."
npm run db:migrate:prod

# Deploy to Cloudflare Pages
echo "☁️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name smart-city-bms

echo "✅ Deployment completed successfully!"
echo "🌐 Your Smart City BMS is now live at: https://smart-city-bms.pages.dev"
echo "📖 Check the README.md for usage instructions and API documentation"