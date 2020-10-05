"""chat_bot_server URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf.urls.static import static
from user import views as user_views
from channels_app import views as chat_views
from chat_bot_server import settings


urlpatterns = [
    path('admin/', admin.site.urls),

    path('register/', user_views.register),
    path('login/', user_views.user_login),
    path('logout/', user_views.user_logout),
    path('profile/set/', user_views.set_profile),
    path('profile/photo/', user_views.set_photo),
    path('profile/photo/delete', user_views.set_photo_delete),
    path('profile/test/', user_views.set_chat_test),

    path('me/add/', user_views.add_me),

    path('friend/add/', user_views.add_friend),
    path('friend/delete/', user_views.del_friend),
    path('friend/getlist/', user_views.get_friend),

    # chat room
    path('chat/join/', chat_views.room_join),
    path('chat/list/', chat_views.get_room_list),
    path('chat/info/', chat_views.get_participants),
    path('chat/mode/', chat_views.set_room_ceslea_mode),
    path('chat/category/', chat_views.set_room_ceslea_category),
    path('chat/invite/', chat_views.room_invite),
    path('chat/exit/', chat_views.room_exit),
    path('chat/summary/', chat_views.chat_summary),
    path('chat/file/', chat_views.set_file),

    path('chat/message/count/', chat_views.get_unreadable_messages_count),
    
    # ceslea
    path('oauth2/token', chat_views.ceslea_login),
    path('v3/events', chat_views.get_chat_event),
    path('v3/message/summary/<str:room>/<str:msg>', chat_views.fetch_message),
    path('v3/messages/<str:room>/<int:count>', chat_views.get_message),
    path('v3/message/<str:room>', chat_views.send_message),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)