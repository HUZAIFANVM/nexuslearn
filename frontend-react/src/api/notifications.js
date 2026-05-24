import client from './client';

export const getNotifications = (skip = 0, limit = 30) =>
  client.get('/notifications', { params: { skip, limit } });

export const getUnreadCount = () =>
  client.get('/notifications/unread-count');

export const markAsRead = (id) =>
  client.post(`/notifications/${id}/read`);

export const markAllAsRead = () =>
  client.post('/notifications/read-all');
