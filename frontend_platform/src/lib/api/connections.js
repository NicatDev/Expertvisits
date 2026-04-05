import api from './client';

export const connectionsApi = {
    accept: (id) => api.post(`/connections/requests/${id}/accept/`),
    decline: (id) => api.post(`/connections/requests/${id}/decline/`),
    cancel: (id) => api.post(`/connections/requests/${id}/cancel/`),
};
