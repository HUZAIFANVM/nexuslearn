import client from './client';

export const getSuggestions = () => client.get('/mentorship/suggestions');
export const createMentorship = (data) => client.post('/mentorship', data);
export const listMentorships = () => client.get('/mentorship');
export const getMyMentorships = () => client.get('/mentorship/me');
export const deleteMentorship = (id) => client.delete(`/mentorship/${id}`);
