# Custom SearXNG image with built-in configuration
FROM searxng/searxng:2025.8.8-5e7109c

# Set environment variables to prevent automatic config generation
ENV SEARXNG_SETTINGS_PATH=/usr/local/searxng/searxng/settings.yml

# Switch to root for file operations
USER root

# Copy our custom settings to the default location
COPY settings.yml /usr/local/searxng/searxng/settings.yml

# Set proper permissions
RUN chown searxng:searxng /usr/local/searxng/searxng/settings.yml && \
    chmod 644 /usr/local/searxng/searxng/settings.yml

# Switch back to searxng user
USER searxng

# Expose port
EXPOSE 8080