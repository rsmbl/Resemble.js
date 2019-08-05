FROM node:12

RUN apt-get update \
    && apt-get install -qq libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev librsvg2-dev build-essential g++

RUN mkdir -p /opt/node/js \
    && cd /opt/node

WORKDIR /opt/node/js
COPY . /opt/node/js

RUN npm install

CMD ["npm", "run", "test"]
