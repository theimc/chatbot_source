from django.contrib.auth.models import (
    BaseUserManager, AbstractBaseUser, PermissionsMixin
)
from django.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _


class UserManager(BaseUserManager):
    def create_user(self, username, password=None):
        # if not email:
        #     raise ValueError(_('Users must have an email address'))

        user = self.model(
            # email=self.normalize_email(email),
            username=username,
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password):
        user = self.create_user(
            password=password,
            username=username,
        )

        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(verbose_name=_('username'), max_length=30, unique=True)
    email = models.EmailField(verbose_name=_('Email address'), max_length=255, unique=True, blank=True, null=True)
    is_name = models.CharField(verbose_name=_('is name'), max_length=255, blank=True, null=True)
    is_active = models.BooleanField(verbose_name=_('Is active'), default=True)
    date_joined = models.DateTimeField(verbose_name=_('Date joined'), default=timezone.now)
    # 이 필드는 레거시 시스템 호환을 위해 추가할 수도 있다.
    salt = models.CharField(verbose_name=_('Salt'), max_length=10, blank=True)


    status_message = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    signup_date = models.DateTimeField(auto_now_add=True)
    user_thumbnail = models.ImageField(upload_to='profile_img/', blank=True)
    firebase_id = models.CharField(max_length=255, blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = [] # ['email', ]

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ('-date_joined',)

    def __str__(self):
        return self.username

    def get_full_name(self):
        return self.username

    def get_short_name(self):
        return self.username

    @property
    def is_staff(self):
        "Is the user a member of staff?"
        # Simplest possible answer: All superusers are staff
        return self.is_superuser

    get_full_name.short_description = _('Full name')


class FriendList(models.Model):
    my = models.ForeignKey(User, on_delete=models.CASCADE, related_name='my')
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend')
    friendDate = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = '친구 리스트'
        verbose_name = 'friendList'
