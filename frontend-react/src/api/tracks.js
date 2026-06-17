import client from './client';

export const listTracks = () => client.get('/tracks');
export const getTrack = (id) => client.get(`/tracks/${id}`);
export const createTrack = (data) => client.post('/tracks', data);
export const deleteTrack = (id) => client.delete(`/tracks/${id}`);
export const completeTrackStep = (resourceId) =>
  client.post('/tracks/complete-step', { resource_id: resourceId });
