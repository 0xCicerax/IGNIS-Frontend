#!/bin/bash

# IGNIS GitHub Setup Script
# Run this after extracting the zip file

echo "🔥 IGNIS GitHub Setup"
echo "===================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Get GitHub repo URL from user
echo "Enter your GitHub repository URL"
echo "(e.g., https://github.com/yourname/ignis-frontend.git)"
echo ""
read -p "Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ No repository URL provided"
    exit 1
fi

# Initialize git and push
echo ""
echo "📦 Initializing repository..."
git init

echo "📝 Adding files..."
git add .

echo "💾 Creating initial commit..."
git commit -m "Initial commit: IGNIS Protocol Frontend"

echo "🔗 Adding remote..."
git remote add origin "$REPO_URL"

echo "🚀 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Done! Your code is now on GitHub."
echo ""
echo "Next steps:"
echo "  1. Go to https://vercel.com"
echo "  2. Click 'Add New...' → 'Project'"
echo "  3. Select your repository"
echo "  4. Click 'Deploy'"
echo ""
