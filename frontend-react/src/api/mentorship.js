import client from './client';

// HR
export const getSuggestions = () => client.get('/mentorship/suggestions');
export const createMentorship = (data) => client.post('/mentorship', data);
export const listMentorships = () => client.get('/mentorship');
export const deleteMentorship = (id) => client.delete(`/mentorship/${id}`);

// Shared (participants + HR)
export const getMyMentorships = () => client.get('/mentorship/me');
export const getMentorship = (id) => client.get(`/mentorship/${id}`);
export const completeMentorship = (id) => client.post(`/mentorship/${id}/complete`);

export const getSessions = (id) => client.get(`/mentorship/${id}/sessions`);
export const addSession = (id, note, date) => client.post(`/mentorship/${id}/sessions`, { note, date });

export const getMessages = (id) => client.get(`/mentorship/${id}/messages`);
export const sendMessage = (id, text) => client.post(`/mentorship/${id}/messages`, { text });

export const getProgress = (id) => client.get(`/mentorship/${id}/progress`);
export const getResources = (id) => client.get(`/mentorship/${id}/resources`);
