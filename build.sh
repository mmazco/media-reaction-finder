#!/bin/bash
# Build script for Vercel deployment

echo "Building frontend..."
cd frontend
npm install
npm run build

echo "Copying build files to root..."
cd ..
cp -r frontend/dist/* ./

echo "Build complete!"