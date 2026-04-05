import api from './client';

export const chatApi = {
    searchUsers: (q) => api.get('/chat/search-users/', { params: { q } }),
    rooms: () => api.get('/chat/rooms/'),
    createOrGet: (user_id) => api.post('/chat/rooms/create-or-get/', { user_id }),
    messages: (chatId, params) => api.get(`/chat/rooms/${chatId}/messages/`, { params }),
    /** Mark all unread in room for current user (omit body) or up to id */
    markRoomRead: (chatId, up_to_message_id) =>
        api.post(`/chat/rooms/${chatId}/read/`, up_to_message_id != null ? { up_to_message_id } : {}),
};
