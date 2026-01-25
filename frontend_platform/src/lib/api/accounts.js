import api from './client';

export const accounts = {
    getUser: (username) => api.get(`accounts/users/${username}/`),
    updateProfile: (username, data) => api.patch(`accounts/users/${username}/`, data),
};
