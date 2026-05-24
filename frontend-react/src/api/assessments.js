import client from './client';

export const createAssessment = (data) =>
  client.post('/assessments', data);

export const getAssessments = () =>
  client.get('/assessments');

export const getAssessment = (id) =>
  client.get(`/assessments/${id}`);

export const submitAssessment = (id, answers, timeTaken) =>
  client.post(`/assessments/${id}/submit`, {
    answers,
    time_taken_seconds: timeTaken,
  });

export const getAssessmentResults = (id) =>
  client.get(`/assessments/${id}/results`);

export const getAllResults = () =>
  client.get('/assessment-results');

export const deleteAssessment = (id) =>
  client.delete(`/assessments/${id}`);
