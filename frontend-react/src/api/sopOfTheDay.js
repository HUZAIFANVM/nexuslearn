import client from './client';

export const createSOPOfTheDay = (documentId) =>
  client.post('/sop-of-the-day', { document_id: documentId });

export const getActiveSOPOfTheDay = () =>
  client.get('/sop-of-the-day/active');

export const dismissSOPOfTheDay = (sopId) =>
  client.post(`/sop-of-the-day/${sopId}/dismiss`);

export const getSOPHistory = () =>
  client.get('/sop-of-the-day/history');

export const deactivateSOPOfTheDay = (sopId) =>
  client.delete(`/sop-of-the-day/${sopId}`);

export const getAutomationConfig = () =>
  client.get('/sop-of-the-day/automation/config');

export const updateAutomationConfig = (data) =>
  client.put('/sop-of-the-day/automation/config', data);

export const triggerAutomation = () =>
  client.post('/sop-of-the-day/automation/trigger');

export const getAutomationStatus = () =>
  client.get('/sop-of-the-day/automation/status');
