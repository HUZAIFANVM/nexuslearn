import client from './client';

export const getOverview = () => client.get('/analytics/overview');
export const getSkillGaps = (department) =>
  client.get('/analytics/skill-gaps', { params: department ? { department } : {} });
