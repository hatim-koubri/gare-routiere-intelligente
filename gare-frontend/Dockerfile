# ============================================================
# Dockerfile — Frontend Next.js (mode développement)
# Image légère Node.js Alpine pour un démarrage rapide
# ============================================================

# Étape unique : image Node.js légère
FROM node:20-alpine

# Répertoire de travail dans le container
WORKDIR /app

# Copier uniquement les fichiers de dépendances en premier
# (optimise le cache Docker : si package.json n'a pas changé,
#  npm install ne sera pas relancé)
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code source
COPY . .

# Exposer le port 3000 (port par défaut de Next.js en dev)
EXPOSE 3000

# Lancer le serveur de développement Next.js
# -H 0.0.0.0 permet l'accès depuis l'extérieur du container
CMD ["npm", "run", "dev"]
