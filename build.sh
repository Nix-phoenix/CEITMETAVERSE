#!/bin/bash
set -e
cd Script/DataBase
npm install
./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma
./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma
