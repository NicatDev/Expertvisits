import { cache } from 'react';
import apiClient from './client';

async function fetchCompany(companySlug) {
    try {
        const response = await apiClient.get(`/business/companies/${companySlug}/`);
        return response.data;
    } catch (error) {
        if (error?.response?.status === 404) {
            return null;
        }
        console.error('Failed to fetch company:', error);
        return null;
    }
}

/** One HTTP request per RSC tree when called with the same slug. */
export const getCompanyCached = cache(fetchCompany);

export async function getCompany(companySlug) {
    return getCompanyCached(companySlug);
}

/**
 * @param {Object} params — e.g. { company: id, page_size }
 */
export async function getVacancies(params = {}) {
    try {
        const response = await apiClient.get('/business/vacancies/', { params });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch vacancies:', error);
        return { results: [], count: 0 };
    }
}

/**
 * @param {string} companySlug
 * @param {Object} data — { name, email, subject, message }
 */
export async function submitCompanyContact(companySlug, data) {
    const response = await apiClient.post(
        `/business/companies/${companySlug}/contact/`,
        data
    );
    return response.data;
}
