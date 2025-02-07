FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

COPY wait-for-it.sh /usr/src/app/

RUN chmod +x wait-for-it.sh

RUN npm run build

CMD ["node", "dist/main"]
