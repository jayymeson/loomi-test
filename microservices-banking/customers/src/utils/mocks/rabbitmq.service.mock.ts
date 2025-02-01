import { Injectable } from '@nestjs/common';

type MessageHandler = (message: any) => void;

@Injectable()
export class RabbitMQServiceMock {
  private messages: { queue: string; message: any }[] = [];

  async send(queue: string, message: any) {
    this.messages.push({ queue, message });
    return Promise.resolve();
  }

  async subscribe(queue: string, handler: MessageHandler) {
    const messagesForQueue = this.messages.filter((msg) => msg.queue === queue);
    for (const msg of messagesForQueue) {
      handler(msg.message);
    }
    return Promise.resolve();
  }

  clearMessages() {
    this.messages = [];
  }
}
