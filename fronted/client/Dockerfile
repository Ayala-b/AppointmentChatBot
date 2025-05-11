# fronted/client/Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm config set strict-ssl false

RUN npm install

COPY . .

RUN npm run build

RUN npm install -g serve

CMD ["serve", "-s", "build", "-l", "3000"]
