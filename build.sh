#!/bin/bash
set -e
cd Script/DataBase
npm install
node ./node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma
node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma
