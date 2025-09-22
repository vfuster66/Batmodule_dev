#!/bin/bash

echo "🚀 Build rapide optimisé..."

# Vérifier si les images existent déjà
BACKEND_IMAGE=$(docker images -q batmodule-backend 2>/dev/null)
FRONTEND_IMAGE=$(docker images -q batmodule-frontend 2>/dev/null)

# Build seulement si nécessaire
if [ -z "$BACKEND_IMAGE" ]; then
    echo "📦 Build backend (première fois)..."
    docker-compose build backend
else
    echo "✅ Backend image existe déjà"
fi

if [ -z "$FRONTEND_IMAGE" ]; then
    echo "📦 Build frontend (première fois)..."  
    docker-compose build frontend
else
    echo "✅ Frontend image existe déjà"
fi

echo "🎉 Build terminé !"
