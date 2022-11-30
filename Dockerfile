FROM node:current-alpine
RUN mkdir /catalog
WORKDIR /catalog
COPY ["server.js","package.json","/catalog/"]
RUN npm install
VOLUME /catalog/certificates

ENV PUBLIC_KEY /catalog/certificates/public.pub
ENV SERVER_PORT=80

ENV MONGODB_HOST=localhost
ENV MONGODB_PORT=27017 
ENV MONGODB_USER=mongoadmin
ENV MONGODB_PASSWORD=secret

ENV MONGODB_DATABASE=catalog

ENV ROUTE_PREFIX=/catalog

ENV CATALOG_NOLOGOFOUND="https://www.kasten.io/hubfs/Kasten%20logos/logo-kasten.io.svg"

EXPOSE ${SERVER_PORT}
CMD ["node","/catalog/server.js"]