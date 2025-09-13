# Custom SearXNG image with built-in configuration
FROM searxng/searxng:2025.8.8-5e7109c

# Switch to root for file operations
USER root

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy our custom settings template
COPY settings.yml /etc/searxng/settings.yml.template

# Create startup script that substitutes environment variables
RUN echo '#!/bin/bash\n\
# Substitute environment variables in settings template\n\
envsubst < /etc/searxng/settings.yml.template > /usr/local/searxng/searxng/settings.yml\n\
\n\
# Set proper permissions\n\
chown searxng:searxng /usr/local/searxng/searxng/settings.yml\n\
chmod 644 /usr/local/searxng/searxng/settings.yml\n\
\n\
# Start SearXNG with the original entrypoint\n\
exec /sbin/tini -- /usr/local/searxng/dockerfiles/docker-entrypoint.sh "$@"' > /usr/local/bin/start-searxng.sh && \
    chmod +x /usr/local/bin/start-searxng.sh

# Switch back to searxng user
USER searxng

# Expose port
EXPOSE 8080

# Use our custom startup script
ENTRYPOINT ["/usr/local/bin/start-searxng.sh"]