FROM node:12.19.0
WORKDIR /app
COPY package.json .
RUN npm i
COPY . .
RUN npm i nodemon -g
CMD ["npm", "run", "dev"]
