FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 5000

RUN npx prisma generate
RUN npm run build

CMD [ "npm","run","start" ]