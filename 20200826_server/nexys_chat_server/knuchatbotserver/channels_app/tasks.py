# Create your tasks here
from __future__ import absolute_import, unicode_literals

from chat_bot_server.celery import app
from channels_app.models import ChatUser

import logging


logger = logging.getLogger("django.channels.server")


@app.task
def set_last_message_read(username, room_id):
    try:
        dcon_user = ChatUser.objects.get(user__username=username, chat_room__id=room_id)
        dcon_user.online = False
        dcon_user.read()
    except ChatUser.DoesNotExist:
        logger.debug("error set last message date")