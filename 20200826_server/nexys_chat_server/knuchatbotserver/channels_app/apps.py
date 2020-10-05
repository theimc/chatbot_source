from django.apps import AppConfig
from django.utils.translation import ugettext_lazy as _


class ChannelsAppConfig(AppConfig):
    name = 'channels_app'
    verbose_name = _('채팅')
