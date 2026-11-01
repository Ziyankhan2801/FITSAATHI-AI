
from django.conf import settings
from django.core.files.storage import FileSystemStorage


class PrivateMediaStorage(FileSystemStorage):
    """
    Stores user-uploaded files in private local storage.

    Public URL generation is explicitly disabled.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(
            location=settings.PRIVATE_MEDIA_ROOT,
            base_url=None,
            file_permissions_mode=0o600,
            directory_permissions_mode=0o700,
        )

    def url(self, name):
        raise ValueError(
            "Public URLs are disabled for private media files."
        )
