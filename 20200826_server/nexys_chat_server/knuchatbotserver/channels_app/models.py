import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _

from user.models import User


VERBOSE_NAME = _('Chat')


def validate_message_content(content):
    if content is None or content == "" or content.isspace():
        raise ValidationError(
            'Content is empty/invalid',
            code='invalid',
            params={'content': content},
        )


class ChatRoom(models.Model):
    id = models.UUIDField(primary_key=True, null=False, default=uuid.uuid4, editable=False)
    bot_state = models.CharField(max_length=10, default='MAX')
    #bot_category = models.CharField(max_length=20, default='chitchat_en')
    # 현재는 사용하지 않는다.
    room_name = models.CharField(max_length=50, blank=True, null=True)
    notification_key = models.CharField(max_length=255)
    is_single = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True)

    def __str__(self):
        return str(self.id)

    class Meta:
        verbose_name = ('chat_room')
        verbose_name_plural = ('채팅 방 목록')


class ChatUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='chat_user')
    room_exit = models.BooleanField(default=False)
    last_read_date = models.DateTimeField(auto_now_add=True, blank=False,null=False)
    online = models.BooleanField(null=False, blank=False, default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    REQUIRED_FIELDS = []

    def __str__(self):
        return self.user.username

    def read(self):
        self.last_read_date = timezone.now()
        self.save()

    def room_join(self):
        self.last_read_date = timezone.now()
        self.created_at = timezone.now()
        self.save()

    class Meta:
        verbose_name = ('chat_user')
        verbose_name_plural = ('채팅 유저 목록')
        unique_together = (('user', 'chat_room'),)


class Message(models.Model):
    id = models.UUIDField(primary_key=True, null=False, default=uuid.uuid4, editable=False)
    author = models.CharField(max_length=100, blank=False, null=False)
    # message, invite, exit
    type = models.CharField(max_length=10, default='message')
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='message')
    content = models.TextField(validators=[validate_message_content])
    created_at = models.DateTimeField(auto_now_add=True, blank=True)

    class Meta:
        verbose_name = ('message')
        verbose_name_plural = ('메세지 목록')


class ChatSummary(models.Model):
    chat_room_id = models.CharField(max_length=32, blank=False, null=False)
    content = models.TextField(validators=[validate_message_content])
    created_at = models.DateTimeField(auto_now_add=True, blank=True)

    class Meta:
        verbose_name = ('chat_summary')
        verbose_name_plural = ('채팅 요약본')