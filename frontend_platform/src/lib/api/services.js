import api from './client';

export const services = {
    getServices: (userId) => api.get(`services/user/${userId}/`), // Get services of a specific user
    createService: (data) => api.post('services/', data),

    bookSlot: (data) => api.post('services/bookings/', data), // data: { provider_id, service_id, timestamp }
    getBookings: (role, status) => api.get('services/bookings/', { params: { role, status } }), // Added status filter
    updateBookingStatus: (id, status) => api.patch(`services/bookings/${id}/`, { status }),

    acceptBooking: (id) => api.post(`services/bookings/${id}/accept/`),
    rejectBooking: (id) => api.post(`services/bookings/${id}/reject/`),

    getEvents: (providerId) => api.get('services/bookings/events/', { params: { provider_id: providerId } }), // Optional provider_id
};
