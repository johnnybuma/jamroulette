# Start with a base Ruby image
FROM ruby:3.0.0

# Set default values for build arguments
ARG RAILS_ENV=production
ARG NODE_ENV=production
ARG BUNDLER_VERSION=2.4.22
ARG NODE_VERSION=16.20.2
ARG INSTALL_DEV_TOOLS=false
ARG TARGETPLATFORM

# Set environment variables
ENV RAILS_ENV=${RAILS_ENV}
ENV NODE_ENV=${NODE_ENV}
ENV RAILS_SERVE_STATIC_FILES=true
ENV RAILS_LOG_TO_STDOUT=true
ENV SECRET_KEY_BASE=${SECRET_KEY_BASE}
ENV RAILS_MASTER_KEY=${RAILS_MASTER_KEY}
ENV MINIO_ROOT_USER=${MINIO_ROOT_USER}
ENV MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
ENV jamrails_DATABASE_PASSWORD=${JAMROULETTE_DATABASE_PASSWORD}
ENV POSTMARK_ACCESS_KEY=$POSTMARK_ACCESS_KEY}
ENV POSTMARK_SECRET_KEY=${POSTMARK_SECRET_KEY}
ENV POSTMARK_API_TOKEN=${POSTMARK_API_TOKEN}
ENV HOSTNAME=${HOSTNAME}





# Install Node.js and Yarn
RUN case "$TARGETPLATFORM" in \
        "linux/amd64") \
          ARCH="x64" ;; \
        "linux/arm64") \
          ARCH="arm64" ;; \
        *) \
          echo "Unsupported architecture: $TARGETPLATFORM" && exit 1 ;; \
        esac && \
        curl -sSLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH.tar.xz" && \
        tar -xJf "node-v$NODE_VERSION-linux-$ARCH.tar.xz" -C /usr/local --strip-components=1 && \
        node --version && \
        echo "deb [trusted=yes] https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

# Install essential packages and development tools based on the environment
RUN apt-get update -qq && \
    apt-get install -y postgresql-client cmake yarn && \
    if [ "$INSTALL_DEV_TOOLS" = "true" ] ; then \
        apt-get install -y build-essential chromium; \
    fi && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/*

# Install Bundler
RUN gem install bundler -v $BUNDLER_VERSION

# Create and set the working directory
RUN mkdir /app
WORKDIR /app

# Install gems
COPY Gemfile Gemfile.lock /app/
RUN bundle config set force_ruby_platform true && \
    if [ "$RAILS_ENV" = "production" ] ; then \
        bundle config set without 'development test' && bundle install --jobs 4 --retry 3; \
    else \
        bundle install --jobs 4 --retry 3; \
    fi

# Install JavaScript dependencies
COPY package.json yarn.lock /app/
RUN yarn install --frozen-lockfile

# Copy the rest of the application
COPY . /app/

# Precompile assets in production
RUN if [ "$RAILS_ENV" = "production" ] ; then bundle exec rails assets:precompile; fi

# Expose the port the server will run on
EXPOSE 3000

# Start the Rails server
CMD ["bundle", "exec", "rails", "s", "-b", "0.0.0.0"]
