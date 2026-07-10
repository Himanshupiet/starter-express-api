FROM node:22
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3010
CMD ["npm", "start"]
