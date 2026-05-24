import client from './client';

export const generateLearningPath = () =>
  client.post('/learning-paths/generate');

export const getMyPath = () =>
  client.get('/learning-paths/me');

export const getAllPaths = () =>
  client.get('/learning-paths/employees');

export const getEmployeePath = (userId) =>
  client.get(`/learning-paths/employees/${userId}`);
