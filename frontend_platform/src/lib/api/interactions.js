import api from './client';

export const interactions = {
    toggleLike: (contentType, objectId) => api.post('interactions/likes/toggle/', { model: contentType, object_id: objectId }),
    // likeContent/unlikeContent aliased to toggle for backward compat or just use toggle
    likeContent: (contentType, objectId) => api.post('interactions/likes/toggle/', { model: contentType, object_id: objectId }),
    unlikeContent: (contentType, objectId) => api.post('interactions/likes/toggle/', { model: contentType, object_id: objectId }),

    getComments: (contentType, objectId) => api.get('interactions/comments/for_object/', { params: { model: contentType, object_id: objectId } }),
    postComment: (contentType, objectId, text, parentId = null) => api.post('interactions/comments/', {
        model: contentType,
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
