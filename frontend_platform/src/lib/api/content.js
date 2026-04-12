import api from './client';

export const content = {
    getFeed: (params) => api.get('content/feed/', { params }), // params: { page, category, sub_category, search }
    getArticleStats: () => api.get('content/article-stats/'),
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

    getPoll: (id) => api.get(`content/polls/${id}/`),
    getUserQuizzes: (userId) => api.get('content/quizzes/', { params: { author: userId } }),
    getQuiz: (slug) => api.get(`content/quizzes/${encodeURIComponent(slug)}/`),
    createQuiz: (data) => api.post('content/quizzes/', data),
    updateQuiz: (slug, data) => api.patch(`content/quizzes/${encodeURIComponent(slug)}/`, data),
    deleteQuiz: (slug) => api.delete(`content/quizzes/${encodeURIComponent(slug)}/`),
    submitQuiz: (slug, answers) => api.post(`content/quizzes/${encodeURIComponent(slug)}/submit/`, { answers }),
    getQuizResult: (slug, params) => api.get(`content/quizzes/${encodeURIComponent(slug)}/result/`, { params }),
    getQuizMyAttempts: (slug) => api.get(`content/quizzes/${encodeURIComponent(slug)}/my-attempts/`),
    getQuizParticipants: (slug) => api.get(`content/quizzes/${encodeURIComponent(slug)}/participants/`),
    getQuizParticipantResult: (slug, userId) =>
        api.get(`content/quizzes/${encodeURIComponent(slug)}/participants/${userId}/`),

};
