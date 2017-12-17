FROM node:8.2.1
MAINTAINER UW Gymnastics

EXPOSE 1337

# Pull whole directory for npm install because it's simple
ADD . /app

WORKDIR app

RUN npm install

CMD npm start


