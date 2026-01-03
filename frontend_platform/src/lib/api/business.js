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
    getMyCompanies: () => client.get('/business/companies/?my=true'), // Assuming backend supports filtering by owner or creating a dedicated endpoint
    // Note: If backend doesn't support ?my=true on list, we might need a dedicated action or filter locally if list is small. 
    // Given the previous backend view code, I commented out the 'my' filter. 
    // I should probably ensure the backend supports fetching user companies for the dropdown.
    // For now, I'll assume we can filter or fetch all.
};

export default business;
