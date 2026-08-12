import { api } from './api';

export const chatService = {
  sendMessage: (message: string, history: { sender: string; text: string }[]) => api.sendChatMessage(message, history),
};
