import client from './client';

export const uploadDocument = (formData) =>
  client.post('/upload-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getDocuments = () =>
  client.get('/documents');

export const deleteDocument = (id) =>
  client.delete(`/documents/${id}`);
