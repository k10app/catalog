FROM node:current-alpine
RUN mkdir /catalog
WORKDIR /catalog
COPY ["server.js","package.json","/catalog/"]
RUN npm install
VOLUME /catalog/certificates

ENV PUBLIC_KEY /catalog/certificates/public.pub
ENV SERVER_PORT=80

ENV MONGODB_HOST=localhost
ENV MONGODB_PORT=3306
ENV MONGODB_DATABASE=userdb
ENV MONGODB_USER=userdblogin
ENV MONGODB_PASSWORD=userdbpassword
ENV MONGODB_ROOT_PASSWORD=userdbrootpass
ENV ROUTE_PREFIX=/catalog

EXPOSE ${SERVER_PORT}
CMD ["node","/catalog/server.js"]