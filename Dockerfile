FROM node:18
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 8001
CMD ["node", "index.js"]
