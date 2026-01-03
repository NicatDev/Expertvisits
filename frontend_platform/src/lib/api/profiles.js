import api from './client';

export const profiles = {
    // Experience
    getExperience: (params) => api.get('profiles/experience/', { params }), // params: { user_id }
    addExperience: (data) => api.post('profiles/experience/', data),
    updateExperience: (id, data) => api.put(`profiles/experience/${id}/`, data),
    deleteExperience: (id) => api.delete(`profiles/experience/${id}/`),

    // Education
    getEducation: (params) => api.get('profiles/education/', { params }),
    addEducation: (data) => api.post('profiles/education/', data),
    updateEducation: (id, data) => api.put(`profiles/education/${id}/`, data),
    deleteEducation: (id) => api.delete(`profiles/education/${id}/`),

    // Skills
    getSkills: (params) => api.get('profiles/skills/', { params }),
    addSkill: (data) => api.post('profiles/skills/', data),
    updateSkill: (id, data) => api.put(`profiles/skills/${id}/`, data),
    deleteSkill: (id) => api.delete(`profiles/skills/${id}/`),

    // Languages
    getLanguages: (params) => api.get('profiles/languages/', { params }),
    addLanguage: (data) => api.post('profiles/languages/', data),
    updateLanguage: (id, data) => api.put(`profiles/languages/${id}/`, data),
    deleteLanguage: (id) => api.delete(`profiles/languages/${id}/`),

    // Certificates
    getCertificates: (params) => api.get('profiles/certificates/', { params }),
    addCertificate: (data) => api.post('profiles/certificates/', data),
    updateCertificate: (id, data) => api.put(`profiles/certificates/${id}/`, data),
    deleteCertificate: (id) => api.delete(`profiles/certificates/${id}/`),

    // Profile Updates (Cover, etc.) - Actually this uses UserViewSet usually?
    // Or we might need a specific endpoint for cover image.
    // UserViewSet 'me' endpoint or patch user.
    updateProfile: (username, data) => api.patch(`accounts/users/${username}/`, data),

    // Change Password
    changePassword: (data) => api.post('accounts/users/set_password/', data),

    // Unified Profile Details
    getProfileDetails: (id_or_username) => {
        const params = {};
        if (isNaN(id_or_username)) params.username = id_or_username;
        else params.user_id = id_or_username;
        return api.get('accounts/profile-details/', { params });
    },
};
