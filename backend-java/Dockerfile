FROM python:3.12-slim

# Install Java 17 and other system dependencies
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk-headless \
    ffmpeg \
    tesseract-ocr \
    libtesseract-dev \
    maven \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python dependencies (for Whisper CLI)
RUN pip install --no-cache-dir openai-whisper

# Copy Maven project
COPY pom.xml .
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Expose port
EXPOSE 8080

# Run the jar
CMD ["java", "-jar", "target/backend-java-0.0.1-SNAPSHOT.jar"]
