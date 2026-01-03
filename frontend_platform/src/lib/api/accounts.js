import api from './client';

export const accounts = {
    getUser: (username) => api.get(`accounts/users/${username}/`),
};
