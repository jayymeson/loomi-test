# Microservices with NestJS and RabbitMQ

This project demonstrates how to build a microservices architecture using NestJS and RabbitMQ for asynchronous communication. The project consists of two microservices: `microservice-1` which publishes messages, and `microservice-2` which consumes those messages.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Getting Started

### Cloning the Repository

Clone this repository to your local machine:

```bash
git clone https://github.com/your-username/nestjs-rabbitmq-microservices.git
cd nestjs-rabbitmq-microservices
```
## Running the Services

### To build and run the Docker containers, use the following command:

```bash
sudo docker-compose up --build
```

This command will build the Docker images and start the containers for microservice-1, `microservice-2`, and RabbitMQ.

## Project Structure

```plaintext
.
├── docker-compose.yml
├── microservice-1
│   ├── Dockerfile
│   ├── nest-cli.json
│   ├── package.json
│   ├── src
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   ├── app.service.ts
│   │   ├── main.ts
│   │   ├── models
│   │   │   └── dto
│   │   │       └── message.dto.ts
│   │   └── rabbitmq
│   │       ├── rabbitmq.module.ts
│   │       └── rabbitmq.service.ts
│   ├── tsconfig.build.json
│   └── tsconfig.json
├── microservice-2
│   ├── Dockerfile
│   ├── nest-cli.json
│   ├── package.json
│   ├── src
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   ├── app.service.ts
│   │   ├── main.ts
│   │   ├── models
│   │   │   └── dto
│   │   │       └── message.dto.ts
│   │   └── rabbitmq
│   │       ├── rabbitmq.module.ts
│   │       └── rabbitmq.service.ts
│   ├── tsconfig.build.json
│   └── tsconfig.json
└── README.md
```

## Usage 

### Sending a Message

To send a message from `microservice-1` to `microservice-2`, use the following CURL command:

```bash
curl -X POST http://localhost:3001 -H "Content-Type: application/json" -d '{"message":"Hello from microservice-1"}'
```

## Viewing Received Messages

Check the logs of `microservice-2` to see the received messages. The logs should display:

```csharp
Message received: Hello from microservice-1
```