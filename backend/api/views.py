
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import FitnessProfile
from .serializers import FitnessProfileSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response(
        {
            'status': 'success',
            'message': 'FitSaathi AI backend is running.',
            'service': 'FitSaathi AI API',
        }
    )


class FitnessProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = FitnessProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = FitnessProfile.objects.get_or_create(
            user=self.request.user
        )
        return profile
