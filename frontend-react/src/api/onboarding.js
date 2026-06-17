import client from './client';

// Employee
export const getMyOnboarding = () => client.get('/onboarding/me');
export const completeOnboardingStep = (resourceId) =>
  client.post('/onboarding/complete-step', { resource_id: resourceId });

// HR
export const createTemplate = (data) => client.post('/onboarding/templates', data);
export const listTemplates = () => client.get('/onboarding/templates');
export const deleteTemplate = (id) => client.delete(`/onboarding/templates/${id}`);
export const getOnboardingStatus = () => client.get('/onboarding/status');
