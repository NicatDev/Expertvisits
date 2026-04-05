import api from './client';

export const websites_api = {
    getTemplate: () => api.get('/websites/'),
    updateTemplate: (templateId, sectionVisibility) =>
        api.post('/websites/', {
            template_id: templateId,
            ...(sectionVisibility && typeof sectionVisibility === 'object'
                ? { section_visibility: sectionVisibility }
                : {}),
        }),
    deactivateTemplate: () => api.delete('/websites/'),
};
