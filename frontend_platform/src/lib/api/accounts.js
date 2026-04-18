import api from './client';

export const accounts = {
    getUser: (username) => api.get(`accounts/users/${username}/`),
    updateProfile: (username, data) => api.patch(`accounts/users/${username}/`, data),
    /** Homepage recommended: minimal payload, fast query */
    getRecommendedUsers: (params) => api.get('accounts/users/recommended/', { params }),
    /** /experts directory: card fields only, searchable users */
    getExpertsDirectory: (params, config = {}) => api.get('accounts/users/experts/', { params, ...config }),
};
