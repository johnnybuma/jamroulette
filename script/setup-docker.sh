#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if an environment argument is provided
ENV=${1:-development}

# Determine the Docker Compose file and env file to use

if [ "$ENV" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.prod"
    BUILD_ARGS="--build-arg RAILS_ENV=production --build-arg NODE_ENV=production"
    echo "-> Using production compose file: $COMPOSE_FILE and environment file: $ENV_FILE"
else
    COMPOSE_FILE="docker-compose.yml"
    ENV_FILE=".env"
    BUILD_ARGS="--build-arg RAILS_ENV=development --build-arg NODE_ENV=development --build-arg INSTALL_DEV_TOOLS=true"
    echo "-> Using development compose file: $COMPOSE_FILE and environment file: $ENV_FILE"
fi

echo "Setting up docker for $ENV environment (this will take ~10 minutes on first run)"

# Build the docker images
echo "-> Building docker images for $ENV environment"
docker compose --env-file $ENV_FILE -f $COMPOSE_FILE build $BUILD_ARGS

# Precompile assets in the development environment
if [ "$ENV" = "development" ]; then
    echo "-> web: Precompiling assets in development"
    docker compose --env-file $ENV_FILE -f $COMPOSE_FILE run --rm web bundle exec rails assets:precompile
fi

# In development, reset the database and build the development image
if [ "$ENV" = "development" ]; then
    echo "-> web: Resetting database"
    docker compose --env-file $ENV_FILE -f $COMPOSE_FILE run --rm web rails db:reset
fi

echo "Setup completed."
