#!/bin/sh

# Aplica migrações pendentes
echo "Aplicando migrações do Prisma..."
npx prisma migrate deploy

# Decide o comando baseado na variável de ambiente
if [ "$NODE_ENV" = "production" ]; then
  echo "Iniciando o aplicativo em produção..."
  exec node dist/main
else
  echo "Iniciando o aplicativo em desenvolvimento..."
  exec npm run start:dev
fi
