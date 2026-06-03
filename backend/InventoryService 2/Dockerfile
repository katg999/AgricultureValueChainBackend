# Dockerfile for InventoryService
# This Dockerfile builds the inventory service for Docker deployment

FROM openjdk:17-alpine

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

COPY target/InventoryService-1.0.0.jar app.jar

RUN chown -R appuser:appgroup /app

EXPOSE 8083

USER appuser

ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=docker"]