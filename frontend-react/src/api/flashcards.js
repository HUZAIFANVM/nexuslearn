import client from './client';

export const createFlashcardSet = (data) =>
  client.post('/flashcard-sets', data);

export const getFlashcardSets = () =>
  client.get('/flashcard-sets');

export const getFlashcardSet = (id) =>
  client.get(`/flashcard-sets/${id}`);

export const deleteFlashcardSet = (id) =>
  client.delete(`/flashcard-sets/${id}`);

export const getDueCards = (setId) =>
  client.get(`/flashcard-sets/${setId}/due`);

export const submitReview = (setId, cardId, quality) =>
  client.post(`/flashcard-sets/${setId}/review`, { card_id: cardId, quality });

export const getSetStats = (setId) =>
  client.get(`/flashcard-sets/${setId}/stats`);

export const getOverviewStats = () =>
  client.get('/flashcard-stats/overview');
