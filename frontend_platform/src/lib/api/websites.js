import api from './client';

export const websites_api = {
    getTemplate: () => api.get('/websites/'),
    updateTemplate: (templateId) => api.post('/websites/', { template_id: templateId }),
    deactivateTemplate: () => api.delete('/websites/'),
};
