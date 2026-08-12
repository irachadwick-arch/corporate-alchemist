FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css data.js game.js /usr/share/nginx/html/

EXPOSE 80
