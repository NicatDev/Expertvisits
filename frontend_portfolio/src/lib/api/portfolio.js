import apiClient from './client';

/**
 * Get user portfolio data by username
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
export async function getUser(username) {
    try {
        const response = await apiClient.get(`/websites/${username}/`);
        return response.data;
    } catch (error) {
        if (error?.response?.status === 404) {
            return null;
        }
        console.error('Failed to fetch user:', error);
        return null;
    }
}

/**
 * Get user portfolio sections data
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
export async function getUserPortfolio(username) {
    try {
        const response = await apiClient.get(`/websites/${username}/sections/`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch portfolio sections:', error);
        return null;
    }
}

/**
 * Get public articles for a portfolio user
 * @param {Object} params { username, url, search }
 */
export async function getArticles({ username, url, search }) {
    if (url) {
        // Handle pagination full url from DRF
        const response = await apiClient.get(url);
        return response.data;
    }
    const params = {};
    if (search) params.search = search;
    const response = await apiClient.get(`/websites/${username}/articles/`, { params });
    return response.data;
}

/**
 * Get specific article detail by slug from public content API
 * @param {string} username
 * @param {string} slug
 */
export async function getArticleDetail(username, slug) {
    const response = await apiClient.get(`/websites/${username}/articles/${slug}/`);
    return response.data;
}

/**
 * Submit contact form
 */
export async function submitContactForm(username, data) {
    const response = await apiClient.post(`/websites/${username}/contact/`, data);
    return response.data;
}
