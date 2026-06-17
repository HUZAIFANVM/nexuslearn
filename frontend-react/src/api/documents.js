import client from './client';

export const uploadDocument = (formData) =>
  client.post('/upload-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getDocuments = () =>
  client.get('/documents');

export const deleteDocument = (id) =>
  client.delete(`/documents/${id}`);

// Fetch the original file as a blob (auth header attached by the client
// interceptor). Used to open onboarding/track "document" steps.
export const downloadDocument = (id) =>
  client.get(`/documents/${id}/download`, { responseType: 'blob' });

