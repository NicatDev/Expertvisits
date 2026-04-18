import api from './client';

export const services = {
    getServices: (userId) => api.get(`services/user/${userId}/`),
    createService: (data) => api.post('services/', data),
};
