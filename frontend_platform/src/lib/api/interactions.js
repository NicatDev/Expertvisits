import api from './client';

export const interactions = {
    likeContent: (contentType, objectId) => api.post('interactions/likes/', { content_type: contentType, object_id: objectId }),
    unlikeContent: (contentType, objectId) => api.delete(`interactions/likes/${contentType}/${objectId}/`),

    getComments: (contentType, objectId) => api.get(`interactions/comments/${contentType}/${objectId}/`),
    postComment: (contentType, objectId, text, parentId = null) => api.post('interactions/comments/', {
        content_type: contentType,
        object_id: objectId,
        text,
        parent: parentId
    }),

    // Follows (Now handled by accounts app UserViewSet)
    followUser: (username) => api.post(`accounts/users/${username}/follow/`),
    unfollowUser: (username) => api.post(`accounts/users/${username}/unfollow/`),
    getFollowers: (username, params) => api.get(`accounts/users/${username}/followers/`, { params }),
    getFollowing: (username, params) => api.get(`accounts/users/${username}/following/`, { params }),
};
