FROM nginx:alpine

# Copy the build files
COPY . /usr/share/nginx/html

# Copy custom nginx config
COPY nginx-docker.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]