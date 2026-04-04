import api from './client';

export const auth = {
    login: (credentials) => api.post('auth/token/', credentials),
    register: (userData) => api.post('accounts/users/', userData),
    checkAvailability: (data) => api.post('accounts/users/check_availability/', data),
    resendCode: (data) => api.post('accounts/users/resend_code/', data),
    verifyEmail: (data) => api.post('accounts/verify-email/', data),
    refreshToken: (refresh) => api.post('auth/token/refresh/', { refresh }),
    getProfile: () => api.get('accounts/users/me/'),
    requestEmailChange: (new_email) =>
        api.post('accounts/users/request_email_change/', { new_email }),
    confirmEmailChange: (new_email, code) =>
        api.post('accounts/users/confirm_email_change/', { new_email, code }),
    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    }
};
