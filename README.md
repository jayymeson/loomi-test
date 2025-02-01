migration para o customers db - docker exec -it customers npx prisma migrate dev --name init --schema=prisma/schema.prisma

migration para o transactions db - docker exec -it transactions npx prisma migrate dev --name init --schema=prisma/schema.prisma
