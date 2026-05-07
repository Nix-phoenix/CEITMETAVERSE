#!/bin/bash
set -e
cd Script/DataBase
npm install
node ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma
node ./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma
