
# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Set npm to ignore optional dependencies and suppress deprecated warnings
# This helps clean up the build output and avoids the boolean@3.2.0 warning
ENV NPM_CONFIG_LOGLEVEL=error
ENV NPM_CONFIG_NO_OPTIONAL=true

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the built app from the build stage
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
