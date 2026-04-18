import client from './client';

export const business = {
    // Vacancies
    getVacancies: (params = {}) => client.get('/business/vacancies/', { params }),
    createVacancy: (data) => client.post('/business/vacancies/', data),
    getVacancy: (id) => client.get(`/business/vacancies/${id}/`),
    updateVacancy: (id, data) => client.patch(`/business/vacancies/${id}/`, data),
    deleteVacancy: (id) => client.delete(`/business/vacancies/${id}/`),

    // Vacancy Applications & Management
    applyToVacancy: (data) => client.post('/business/applications/', data),
    getMyVacancies: (params = {}) => client.get('/business/vacancies/my_vacancies/', { params }),
    getVacancyApplicants: (id) => client.get(`/business/vacancies/${id}/applicants/`),
    getMyApplications: (params = {}) => client.get('/business/applications/', { params }),
    updateApplicationStatus: (id, status) => client.post(`/business/applications/${id}/set_status/`, { status }),

    // Companies
    getCompanies: (params = {}) => client.get('/business/companies/', { params }),
    /** Step 1: multipart form (same fields as before); sends verification email to company email. */
    startCompanyRegistration: (data) => client.post('/business/companies/start-registration/', data),
    /** Step 2: JSON { code } */
    completeCompanyRegistration: (payload) =>
        client.post('/business/companies/complete-registration/', payload),
    getCompany: (slug) => client.get(`/business/companies/${slug}/`),
    updateCompany: (slug, data) => client.patch(`/business/companies/${slug}/`, data),

    // Company Sections
    // Company Sections
    createWhoWeAre: (data) => client.post('/business/who-we-are/', data),
    updateWhoWeAre: (id, data) => client.patch(`/business/who-we-are/${id}/`, data),
    deleteWhoWeAre: (id) => client.delete(`/business/who-we-are/${id}/`),

    createWhatWeDo: (data) => client.post('/business/what-we-do/', data),
    updateWhatWeDo: (id, data) => client.patch(`/business/what-we-do/${id}/`, data),
    deleteWhatWeDo: (id) => client.delete(`/business/what-we-do/${id}/`),

    createOurValue: (data) => client.post('/business/our-values/', data),
    updateOurValue: (id, data) => client.patch(`/business/our-values/${id}/`, data),
    deleteOurValue: (id) => client.delete(`/business/our-values/${id}/`),

    createService: (data) => client.post('/business/services/', data),
    updateService: (id, data) => client.patch(`/business/services/${id}/`, data),
    deleteService: (id) => client.delete(`/business/services/${id}/`),

    getPartnerCards: (params) => client.get('/business/partner-cards/', { params }),
    createPartnerCard: (data) => client.post('/business/partner-cards/', data),
    updatePartnerCard: (id, data) => client.patch(`/business/partner-cards/${id}/`, data),
    deletePartnerCard: (id) => client.delete(`/business/partner-cards/${id}/`),

    getMyCompanies: () => client.get('/business/companies/?my=true'),
};

export default business;
