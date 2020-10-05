KNUChatbotServer readme

# 설치 목록 (python 3 기준)
```
sudo pip3 install -r requirements.txt
sudo apt-get install nginx
sudo apt-get install redis-server
```

# 서버 실행 전 편집 및 작업 (순서대로 작업 할 것)
아래의 명령어의 터미널 위치는 knuchatbotserver 위치에서 진행.

## chat_bot_server/settings.py 수정 및 공유기 관련 설정
```
ALLOWED_HOSTS에 2번째 IP Address 를 현재 서버 구동 IP로 변경
- Client, Server가 같은 네트워크 망일 경우(공유기) 사설 IP 로 사용.
- 만약 Client와 Server가 같은 네트워크 망이 아닌경우(이 경우는 Server가 공유기 DHCP로 동작하는 경우를 가정)
  이 경우 Client와 Server는 같은 네트워크 망으로 연결 되어야 함 또는 공유기 Ip를 static으로 설정하고 포트 포워딩 설정을 필요
  (웹포트는 80이 Default)
- 가장 아래로 내려가면 SERVER_URL = 'http://%s' % (ALLOWED_HOSTS[1])이 존재하는데,
  만약 서버 port가 80이 아닌 다른 것이라면 'http://%s:port' 로 수정.
```

## db 생성 및 관리자, 관리자 페이지 생성
```
python3 manage.py makemigrations channels_app
python3 manage.py makemigrations user
python3 manage.py migrate

python3 manage.py createsuperuser
id와 pw는 ceslea controller에 추가되는 nexys.json 을 기반으로 작성.
(따로 첨부된 설명서 참조)

python3 manage.py collectstatic
```

## nginx 환경 설정
```
bin/cesleaserver 를 편집기로 열어 파일 경로 3가지 수정
("error_log", "location /static/", "location /media/")

nginx 포트 수정 할때는 "listen 80;" 수정 (요구사항에 의거하여 default 포트 8080)

sudo cp ./bin/cesleaserver /etc/nginx/sites-available/cesleaserver
sudo ln /etc/nginx/sites-available/cesleaserver /etc/nginx/sites-enabled/cesleaserver
sudo rm /etc/nginx/sites-enabled/default

sudo service nginx restart
```

## daphne / gunicorn 서비스 편집

```
bin/daphne.service 를 편집기로 열어 파일 경로 수정 (gunicorn.service 동일하게 셋팅)
- WorkingDirectory=/home/abr/knuchatbotserver

sudo ln ./bin/daphne.service /etc/systemd/system/daphne.service
sudo ln ./bin/gunicorn.service /etc/systemd/system/gunicorn.service

sudo systemctl enable daphne
sudo systemctl start daphne
sudo systemctl enable gunicorn
sudo systemctl start gunicorn
sudo systemctl enable nginx
sudo systemctl start nginx

필요시에는 아래와 같은 커맨드도 사용 가능
sudo systemctl stop daphne (restart도 존재)
```

## celery 작업 스케쥴 관리 프로그램 실행
```
knuchatbotserver 폴더 위치에서 터미널을 열고, celery 실행.

celery -A chat_bot_server worker -l info
```