FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

COPY wait-for-it.sh /usr/src/app/

RUN chmod +x wait-for-it.sh

RUN npm run build

CMD ["sh", "-c", "./wait-for-it.sh postgres-transactions:5432 -- npx prisma migrate dev --name init && node dist/main"]
