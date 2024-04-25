FROM node:21-alpine3.18

RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

ADD . /app
WORKDIR /app

RUN npm install

ENTRYPOINT ["npm", "run", "start", "--"]
