# ✅ Updated Base Image
FROM node:lts-bullseye

# ✅ Install required packages safely
RUN apt-get update --allow-releaseinfo-change && \
    apt-get install -y --no-install-recommends \
      ffmpeg \
      imagemagick \
      webp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ✅ Set working directory
WORKDIR /usr/src/app

# ✅ Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# ✅ Copy rest of the repo
COPY . .

# ✅ Default command
CMD ["node", "index.js"]
