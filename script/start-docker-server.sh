#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if an environment argument is provided
ENV=${1:-development}

# Determine the Docker Compose file and env file to use based on the environment

if [ "$ENV" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.prod"
    echo "-> Using production compose file: $COMPOSE_FILE and environment file: $ENV_FILE"
else
    COMPOSE_FILE="docker-compose.yml"
    ENV_FILE=".env"
    echo "-> Using development compose file: $COMPOSE_FILE and environment file: $ENV_FILE"
fi

echo "Starting Jam Roulette in $ENV environment..."
echo "-> Starting docker web server"

# Start the Docker Compose services
if [ "$ENV" = "production" ]; then
    echo "-> Starting in detached mode"
    docker compose --env-file $ENV_FILE -f $COMPOSE_FILE up -d
else
    docker compose --env-file $ENV_FILE -f $COMPOSE_FILE up
fi
