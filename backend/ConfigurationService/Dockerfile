# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Build and install the shared module into the local Maven repo first
COPY shared /app/shared
WORKDIR /app/shared
RUN mvn clean install -DskipTests

# Now build the actual service — it can now resolve com.ugaap:shared
WORKDIR /app/ConfigurationService
COPY AuthenticationService/pom.xml .
RUN mvn dependency:go-offline -B
COPY AuthenticationService/src src
RUN mvn clean package -DskipTests

# ---- Run stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/ConfigurationService/target/*.jar app.jar
EXPOSE 8089
ENTRYPOINT ["java", "-jar", "app.jar"]