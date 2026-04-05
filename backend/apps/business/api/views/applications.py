from django.db import transaction

from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.business.models import VacancyApplication
from apps.business.api.serializers import VacancyApplicationSerializer
from apps.business.api.views.vacancies import _user_owns_vacancy
from apps.notifications.services import notify_vacancy_application

class ApplicationListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = VacancyApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see their own applications
        return VacancyApplication.objects.filter(
            applicant=self.request.user
        ).select_related(
            'vacancy', 'vacancy__company', 'vacancy__company__owner', # Essential for display
            'vacancy__sub_category',
            'applicant'
        )

    def perform_create(self, serializer):
        vacancy = serializer.validated_data['vacancy']
        if VacancyApplication.objects.filter(vacancy=vacancy, applicant=self.request.user).exists():
            raise serializers.ValidationError("You have already applied to this vacancy.")
        application = serializer.save(applicant=self.request.user)
        app_id = application.pk
        transaction.on_commit(lambda: notify_vacancy_application(app_id))

class ApplicationDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = VacancyApplication.objects.select_related(
        'vacancy', 'vacancy__company', 'applicant'
    )
    serializer_class = VacancyApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

class ApplicationStatusAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        try:
            application = VacancyApplication.objects.select_related('vacancy', 'vacancy__company').get(pk=pk)
        except VacancyApplication.DoesNotExist:
             return Response({"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND)

        if not _user_owns_vacancy(request.user, application.vacancy):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        if new_status not in ['accepted', 'rejected', 'pending']:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        
        application.status = new_status
        application.save()
        return Response({'status': 'updated'})
