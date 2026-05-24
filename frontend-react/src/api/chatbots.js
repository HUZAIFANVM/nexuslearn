import client from './client';

export const createChatbot = (data) =>
  client.post('/chatbots', data);

export const getChatbots = () =>
  client.get('/chatbots');

export const deleteChatbot = (id) =>
  client.delete(`/chatbots/${id}`);

// Non-streaming fallback
export const sendMessage = (chatbotId, message) =>
  client.post('/chat', { chatbot_id: chatbotId, message });

export const getChatHistory = (chatbotId) =>
  client.get(`/chat-history/${chatbotId}`);

export const clearChatHistory = (chatbotId) =>
  client.delete(`/chat-history/${chatbotId}`);

// Streaming chat via SSE using native fetch (needs POST + JWT, so EventSource won't work)
export const sendMessageStream = async (chatbotId, message, onToken, onDone, onError) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ chatbot_id: chatbotId, message }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // Keep incomplete chunk

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              onToken(data.token);
            } else if (data.done) {
              onDone(data.full_response);
            } else if (data.error) {
              onError(data.error);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (err) {
    onError(err.message || 'Connection failed');
  }
};
