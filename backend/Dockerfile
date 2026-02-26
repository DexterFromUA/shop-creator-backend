FROM node:20

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

RUN yarn run db:generate

CMD ["sh", "-c", "yarn db:migrate && yarn dev"]
