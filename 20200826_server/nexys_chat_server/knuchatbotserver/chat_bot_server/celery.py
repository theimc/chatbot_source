import os
from celery import Celery
from django.conf import settings


# `celery` 프로그램을 작동시키기 위한 기본 장고 세팅 값을 정한다.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chat_bot_server.settings')

app = Celery('chat_bot_server')

# namespace='CELERY'는 모든 셀러리 관련 구성 키를 의미한다. 반드시 CELERY라는 접두사로 시작해야 한다.
app.config_from_object('django.conf:settings', namespace='CELERY')

# 장고 app config에 등록된 모든 taks 모듈을 불러온다.
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)


@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))
