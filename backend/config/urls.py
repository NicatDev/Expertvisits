from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # path('api/auth/', include('rest_framework.urls')), # Login/Logout (Browsables)
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/', include('apps.accounts.api.urls')),
    path('api/content/', include('apps.content.api.urls')),
    path('api/profiles/', include('apps.profiles.api.urls')),
    path('api/business/', include('apps.business.api.urls')),
    path('api/services/', include('apps.services.api.urls')),
    path('api/interactions/', include('apps.interactions.api.urls')),
    path('api/chat/', include('apps.chat.api.urls')),
    path('api/connections/', include('apps.connections.api.urls')),
    path('api/notifications/', include('apps.notifications.api.urls')),
    path('api/websites/', include('apps.websites.urls')),
    path('api/seo/', include('seo.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
