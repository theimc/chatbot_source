from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.conf.urls import url
from django.urls import path
from . import consumers
# from simple_chat_project import urls

websocket_urlpatterns = [
    path('chat/room/', consumers.ChatConsumer),
]

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
    # 'http': URLRouter(urls.urlpatterns)
})
