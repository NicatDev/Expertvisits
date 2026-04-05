from rest_framework import generics, permissions, filters, pagination

from rest_framework.response import Response
from django.db.models import Count, Q
from apps.accounts.models import User
from apps.accounts.api.serializers import UserSerializer
from apps.connections.utils import with_connection_annotations

class ExpertListAPIView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'profession_sub_category__name']
    ordering_fields = ['followers_count', 'date_joined']
    pagination_class = pagination.PageNumberPagination


    def get_queryset(self):
        queryset = User.objects.select_related('profession_sub_category', 'website').prefetch_related('company', 'educations', 'skills').annotate(
            followers_count=Count('followers', distinct=True),
            following_count=Count('following', distinct=True)
        ).filter(is_searchable=True)

        # Exclude self
        queryset = queryset.exclude(id=self.request.user.id)

        # 1. Location Filtering (OR Logic) - "Baku" OR "Sumgait"
        locations = self.request.query_params.getlist('locations') or self.request.query_params.getlist('locations[]')
        if locations:
            # Handle comma separated if passed as single string? Frontend should send list.
            # Safety check: if standard query dict, getlist works.
            location_query = Q()
            for loc in locations:
                if loc.strip():
                    location_query |= Q(city__icontains=loc.strip())
            queryset = queryset.filter(location_query)

        # 2. Hard Skills (AND Logic) - Must have ALL selected
        hard_skills = self.request.query_params.getlist('hard_skills') or self.request.query_params.getlist('hard_skills[]')
        for skill_name in hard_skills:
            if skill_name.strip():
                queryset = queryset.filter(
                    skills__name__icontains=skill_name.strip(), 
                    skills__skill_type='hard'
                )

        # 3. Soft Skills (AND Logic)
        soft_skills = self.request.query_params.getlist('soft_skills') or self.request.query_params.getlist('soft_skills[]')
        for skill_name in soft_skills:
            if skill_name.strip():
                queryset = queryset.filter(
                    skills__name__icontains=skill_name.strip(), 
                    skills__skill_type='soft'
                )

        # 4. Degree (Strict Match)
        degree = self.request.query_params.get('degree')
        if degree:
            queryset = queryset.filter(educations__degree_type=degree)

        profession_sub_category_id = self.request.query_params.get('profession_sub_category_id')
        if profession_sub_category_id:
            queryset = queryset.filter(profession_sub_category_id=profession_sub_category_id)

        queryset = with_connection_annotations(queryset, self.request.user)

        return queryset.order_by('-followers_count') # Default order by popularity? Or random? 
        # User didn't specify, but popularity is good for experts.
