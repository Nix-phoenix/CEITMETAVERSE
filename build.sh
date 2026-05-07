#!/bin/bash
cd Script/DataBase
npm install
npx prisma generate --schema=./prisma/schema.prisma
npx prisma migrate deploy --schema=./prisma/schema.prisma
