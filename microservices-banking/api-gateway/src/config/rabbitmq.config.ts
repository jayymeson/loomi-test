export const rabbitMQConfig = {
  exchanges: [
    {
      name: 'customer-exchange',
      type: 'topic',
    },
  ],
  uri:
    `${process.env.URI_RABBITMQ_LOCAL} ` || 'amqp://guest:guest@rabbitmq:5672',
  connectionInitOptions: { wait: false },
};
