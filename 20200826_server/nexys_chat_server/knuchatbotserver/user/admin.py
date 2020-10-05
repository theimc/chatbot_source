from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
# from django.contrib.auth.models import Group
from django.utils.translation import ugettext_lazy as _

from user.forms import UserCreationForm, UserChangeForm
from user.models import User, FriendList


class UserAdmin(BaseUserAdmin):
    # The forms to add and change user instances
    form = UserChangeForm
    add_form = UserCreationForm

    # The fields to be used in displaying the User model.
    # These override the definitions on the base UserAdmin
    # that reference specific fields on auth.User.
    list_display = ('get_full_name', 'email', 'username', 'is_name',
                    'status_message', 'phone_number', 'user_thumbnail', 'is_active', 'is_superuser',
                    'date_joined' ,'signup_date')
    list_display_links = ('get_full_name',)
    list_filter = ('is_superuser', 'is_active',)
    fieldsets = (
        #(None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('username', 'password')}),
        (None, {'fields': ('is_name', 'email', 'status_message', 'phone_number', 'user_thumbnail')}),
        (None, {'fields': ('firebase_id',)}),
        (_('Permissions'), {'fields': ('is_active', 'is_superuser',)}),
    )
    # add_fieldsets is not a standard ModelAdmin attribute. UserAdmin
    # overrides get_fieldsets to use this attribute when creating a user.
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2')}
         ),
    )
    search_fields = ('email', 'username')
    ordering = ('-date_joined',)
    filter_horizontal = ()


class FriendListAdmin(admin.ModelAdmin):
    list_display = ('id', 'my_username', 'friend_username', 'friendDate')
    search_fields = ('id', 'my__username', 'friend__username')

    def my_username(self, obj):
        return obj.my.username

    def friend_username(self, obj):
        return obj.friend.username


admin.site.register(User, UserAdmin)
admin.site.register(FriendList, FriendListAdmin)