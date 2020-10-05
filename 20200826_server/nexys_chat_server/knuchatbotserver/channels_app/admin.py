from django.contrib import admin
from channels_app.models import Message, ChatUser, ChatRoom, ChatSummary


class ChatUserInline(admin.TabularInline):
    model = ChatUser
    # max_num = 10
    extra = 0


class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'bot_state', 'room_name', 'is_single', 'created_at')
    search_fields = ('id', 'created_at')

    inlines = [ChatUserInline, ]


class ChatUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'userID', 'chat_room', 'room_exit', 'last_read_date', 'online', 'created_at')
    list_display_links = ('chat_room',)
    search_fields = ('user__username',)

    def userID(self, obj):
        return obj.user.username

class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'type', 'chat_room', 'content', 'created_at')
    search_fields = ('id', 'author')

class ChatSummaryAdmin(admin.ModelAdmin):
    list_display = ('id', 'chat_room_id', 'content', 'created_at')
    search_fields = ('id', 'chat_room_id')


admin.site.register(ChatRoom, ChatRoomAdmin)
admin.site.register(ChatUser, ChatUserAdmin)
admin.site.register(Message, MessageAdmin)
admin.site.register(ChatSummary, ChatSummaryAdmin)