import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/',
});

import { toast } from 'react-toastify';

// Request interceptor
api.interceptors.request.use((config) => {
    let token = null;
    let lang = 'en';

    if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
        lang = localStorage.getItem('language') || 'en';
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Accept-Language'] = lang;

    return config;
}, (error) => {
    return Promise.reject(error);
});

// For handling multiple requests when token expires
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Response interceptor
api.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {

        if (isRefreshing) {
            return new Promise(function (resolve, reject) {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
                return api(originalRequest);
            }).catch(err => {
                return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

        if (!refreshToken) {
            // No refresh token, can't refresh
            isRefreshing = false;
            // Maybe handle logout here or just let it fail
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                // Optional: Redirect to login or dispatch event
                window.location.href = '/auth/login';
            }
            return Promise.reject(error);
        }

        try {
            // Using a new axios instance to avoid interceptors on the refresh call itself ideally, 
            // but effectively valid refresh call shouldn't 401 immediately unless token is bad.
            // Using direct axios call to avoid circular dependency if we tried to import 'auth' helper.
            const response = await axios.post((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/') + 'auth/token/refresh/', {
                refresh: refreshToken
            });

            const { access } = response.data;

            if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', access);
            }

            api.defaults.headers.common['Authorization'] = 'Bearer ' + access;
            originalRequest.headers['Authorization'] = 'Bearer ' + access;

            processQueue(null, access);
            isRefreshing = false;

            return api(originalRequest);

        } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;

            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/auth/login';
            }
            return Promise.reject(refreshError);
        }
    }

    const message = error.response?.data?.detail || error.message || 'Something went wrong';

    // Use toast to show error. Preventing duplicate toasts could be good but this is simple MVP.
    // Check if we are on client side
    if (typeof window !== 'undefined' && error.response?.status !== 401) {
        toast.error(message, {
            position: "top-center",
            autoClose: 3000,
        });
    }

    return Promise.reject(error);
});

export default api;
