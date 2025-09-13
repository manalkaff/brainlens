# Custom SearXNG image with built-in configuration
FROM searxng/searxng:2025.8.8-5e7109c

# Copy configuration files into the image
COPY settings.yml /etc/searxng/settings.yml
COPY limiter.toml /etc/searxng/limiter.toml

# Set proper permissions
RUN chown -R searxng:searxng /etc/searxng/

# Expose port
EXPOSE 8080

# Use the default entrypoint from base image