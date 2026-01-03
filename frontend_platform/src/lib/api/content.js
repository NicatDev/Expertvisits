import api from './client';

export const content = {
    getFeed: (params) => api.get('content/feed/', { params }), // params: { page, category, sub_category, search }
    getUserArticles: (userId) => api.get('content/articles/', { params: { author: userId } }),
    getArticle: (slug) => api.get(`content/articles/${slug}/`),
    createArticle: (data) => {
        const isFormData = data instanceof FormData;
        return api.post('content/articles/', data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
    },
    updateArticle: (slug, data) => {
        const isFormData = data instanceof FormData;
        return api.patch(`content/articles/${slug}/`, data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
    },
    deleteArticle: (slug) => api.delete(`content/articles/${slug}/`),

    getUserQuizzes: (userId) => api.get('content/quizzes/', { params: { author: userId } }),
    getQuiz: (id) => api.get(`content/quizzes/${id}/`),
    createQuiz: (data) => api.post('content/quizzes/', data),
    updateQuiz: (id, data) => api.patch(`content/quizzes/${id}/`, data),
    deleteQuiz: (id) => api.delete(`content/quizzes/${id}/`),
    submitQuiz: (id, answers) => api.post(`content/quizzes/${id}/submit/`, { answers }),

    getUserSurveys: (userId) => api.get('content/surveys/', { params: { author: userId } }),
    getSurvey: (id) => api.get(`content/surveys/${id}/`),
    createSurvey: (data) => api.post('content/surveys/', data),
    updateSurvey: (id, data) => api.patch(`content/surveys/${id}/`, data),
    deleteSurvey: (id) => api.delete(`content/surveys/${id}/`),
    submitSurvey: (id, answer) => api.post(`content/surveys/${id}/submit/`, { answer }),
};
