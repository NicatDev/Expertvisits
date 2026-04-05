import api from './client';

export const notificationsApi = {
    summary: () => api.get('/notifications/summary/'),
    inbox: (params) => api.get('/notifications/inbox/', { params }),
    markAllRead: () => api.post('/notifications/inbox/mark-all-read/'),
    markRead: (body) => api.patch('/notifications/inbox/read/', body),
    deleteInbox: (id) => api.delete(`/notifications/inbox/${id}/`),
};
