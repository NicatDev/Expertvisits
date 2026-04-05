from rest_framework import serializers
from apps.interactions.models import Like, Comment
from apps.accounts.models import User

# Thread root = depth 0; reply = 1; reply to reply = 2. No replies on depth 2 (max 3 visible levels).
MAX_COMMENT_THREAD_DEPTH = 2


def comment_ancestor_depth(comment: Comment) -> int:
    """How many parent links from this comment up to the thread root (root comment has depth 0)."""
    depth = 0
    cur = comment
    while cur.parent_id:
        depth += 1
        cur = Comment.objects.only("parent_id").get(pk=cur.parent_id)
        if depth > 20:
            break
    return depth


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'avatar', 'avatar_compressed']

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'user', 'text', 'created_at', 'replies', 'likes_count', 'is_liked', 'object_id', 'parent']
        extra_kwargs = {
            'object_id': {'required': True},
            'parent': {'required': False}
        }

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        user = self.context.get('request').user if 'request' in self.context else None
        if user and user.is_authenticated:
            return obj.likes.filter(user=user).exists()
        return False

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True, context=self.context).data
        return []

    def validate_parent(self, value):
        if value is None:
            return value
        if comment_ancestor_depth(value) >= MAX_COMMENT_THREAD_DEPTH:
            raise serializers.ValidationError(
                "Maximum reply depth reached (no replies on nested replies)."
            )
        return value

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = '__all__'
