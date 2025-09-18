FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

# Serve production build with a simple static server
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]