FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./mvnw -q -DskipTests package 2>/dev/null || (apk add --no-cache maven && mvn -q -DskipTests package)

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/campus-club-management-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh","-c","java -jar app.jar"]
