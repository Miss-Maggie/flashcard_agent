#!/bin/bash

# FlashCard Agent - Firebase Deployment Script
echo "🚀 Starting FlashCard Agent deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed! dist directory not found."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy --only hosting

echo "🎉 Deployment complete!"
echo "🌐 Your app should be live at: https://flashcard-agent.web.app"