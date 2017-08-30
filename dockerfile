FROM node:8

RUN apt-get update \
    && apt-get install -qq libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++

RUN mkdir -p /opt/node/js \
    && cd /opt/node \
    && npm install canvas color-convert

WORKDIR /opt/node/js
COPY . /opt/node/js

RUN npm install

CMD ["npm", "run", "test"]