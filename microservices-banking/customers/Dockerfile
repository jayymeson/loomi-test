FROM node:18-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache \
    openssl \
    libstdc++ \
    bash \
    libc6-compat

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

COPY wait-for-it.sh /usr/src/app/
RUN chmod +x wait-for-it.sh

RUN npm run build

CMD ["sh", "-c", "./wait-for-it.sh postgres-customers:5432 -- npx prisma migrate deploy && node dist/main"]