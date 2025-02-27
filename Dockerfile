ARG MVN_VERSION=3.9.6
ARG JDK_VERSION=17

FROM maven:${MVN_VERSION}-jdk-${JDK_VERSION} as MAVEN_TOOL_CHAIN_CACHE
LABEL maintainer="Eddie Rantsimele<ed@reanimate.io>"

WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline

COPY ./pom.xml /tmp/
COPY ./src /tmp/src/
WORKDIR /tmp/
RUN mvn clean package

# https://hub.docker.com/_/openjdk?tab=tags&page=1&name=8-jre-slim
# https://hub.docker.com/_/openjdk?tab=tags&page=1&name=8-jre-alpine

# FROM openjdk:{JDK_VERSION}-jre-slim
FROM openjdk:${JDK_VERSION}-jre-alpine

COPY --from=MAVEN_TOOL_CHAIN_CACHE /tmp/target/firebase-spring-boot-crud-0.0.1-SNAPSHOT.jar /firebase-spring-boot-crud-0.0.1.jar

EXPOSE 8080
EXPOSE 8081
EXPOSE 8778
EXPOSE 9779

# debug options
# ENV _JAVA_OPTIONS '-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005'

ENV _JAVA_OPTIONS "-XX:+UnlockExperimentalVMOptions -XX:+UseCGroupMemoryLimitForHeap -Xms256m -Xmx512m -Djava.awt.headless=true -Dspring.output.ansi.enabled=ALWAYS"

CMD ["java", "-jar", "-Djava.security.egd=file:/dev/./urandom", "-Dspring.profiles.active=default", "/firebase-spring-boot-crud-0.0.1.jar"]