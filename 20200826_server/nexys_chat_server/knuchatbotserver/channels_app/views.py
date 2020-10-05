import json
import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import login, authenticate
from django.db.models import Q
from django.db.utils import IntegrityError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from channels_app.models import ChatUser, Message, ChatRoom, ChatSummary
from chat_bot_server import settings
from chat_bot_server.notification import create_notification_group, add_notification_group, remove_notification_group, group_notification
from user.models import User
from django.core.cache import cache
from requests_toolbelt.multipart import decoder
import requests
import os



logger = logging.getLogger(__name__)


@csrf_exempt
def room_join(request):
    response = dict()
    # 룸생성과 동시에 해당 룸에는 세실리아가 만들어진다.
    try:
        json_data = json.loads(request.body.decode('UTF8'))

        my_username = json_data['my']
        participants = json_data['participants']
        room_id = json_data['room_id']

        if room_id  == 'me':
            len_participants = len(participants)
            # 1:1 대화 확인용
                
            chat_room = ChatRoom.objects.create(is_single=False)

            # 1:1 채팅 및 단체톡 생성
            room_id = str(chat_room.id)

            ceslea, _ = User.objects.get_or_create(username='ceslea')
            ChatUser.objects.create(user=ceslea, chat_room=chat_room)

            registration_ids = list()
            user = User.objects.get(username=my_username)
            registration_ids.append(user.firebase_id)
            ChatUser.objects.create(user=user, chat_room=chat_room)

            notification_key = create_notification_group(room_id, registration_ids)
            chat_room.notification_key = notification_key
            chat_room.save()

            # 초대 및 방 개설 됨을 알려준다.
            response['room_id'] = room_id
            
            participants_info = list()
            user_dict = dict()
            user_dict['id'] = my_username
            user = User.objects.get(username=my_username)
            user_thumbnail_url = str(user.user_thumbnail)
            if user_thumbnail_url:
                user_dict['profile_image'] = settings.SERVER_MEDIA_URL + user_thumbnail_url
            else:
                user_dict['profile_image'] = settings.DEFULT_USER_THUMBNAIL_URL

            participants_info.append(user_dict)

            response['room_name'] = my_username
            # response['room_name'] = user.is_name

            def extract_time(user_dict):
                return user_dict['id']

            participants_info.sort(key=extract_time)
            response['participants'] = participants_info
            response['mode'] = chat_room.bot_state

            cache.set("room_cm:" + room_id, chat_room.bot_state.lower())

        else :
            len_participants = len(participants)
            if not room_id:
                # 1:1 대화 확인용
                if len_participants == 1:
                    try:
                        # 만약 방을 만들 때, 1:1 방이 존재 한다면
                        # 더이상 진행하지 않고, 해당 방에 정보를 보내준다.
                        my_chat_list = ChatUser.objects.filter(user__username=my_username)
                        for my_chat in my_chat_list.iterator():
                            my_chat_room = my_chat.chat_room
                            is_single = my_chat_room.is_single

                            if is_single:
                                is_user = my_chat_room.chat_user.filter(user__username=participants[0]).count()
                                if 1 == is_user:
                                    room_id = str(my_chat_room.id)
                                    response['room_name'] = participants[0]
                                    response['room_id'] = room_id

                                    response['participants'] = [{'id': participants[0]}]
                                    user = User.objects.get(username=participants[0])
                                    user_thumbnail_url = str(user.user_thumbnail)
                                    if user_thumbnail_url:
                                        response['participants'][0]['profile_image'] = settings.SERVER_MEDIA_URL + user_thumbnail_url
                                    else:
                                        response['participants'][0]['profile_image'] = settings.DEFULT_USER_THUMBNAIL_URL

                                    if my_chat.room_exit:
                                        my_chat.room_exit = False
                                        my_chat.room_join()

                                        registration_id = my_chat.user.firebase_id
                                        notification_key = add_notification_group(room_id, my_chat_room.notification_key, [registration_id])

                                        if notification_key != '':
                                            my_chat_room.notification_key = notification_key
                                            my_chat_room.save()

                                    cache.set("room_cm:" + room_id, my_chat_room.bot_state.lower())

                                    return JsonResponse(response, safe=False)
                                
                    except ChatUser.DoesNotExist:
                        response['room_id'] = None
                        return JsonResponse(response, safe=False)

                    chat_room = ChatRoom.objects.create(is_single=True)
                else:
                    chat_room = ChatRoom.objects.create(is_single=False)

                # 1:1 채팅 및 단체톡 생성
                room_id = str(chat_room.id)

                ceslea, _ = User.objects.get_or_create(username='ceslea')
                ChatUser.objects.create(user=ceslea, chat_room=chat_room)

                registration_ids = list()
                for i, participant in enumerate(participants + [my_username]):
                    user = User.objects.get(username=participant)
                    registration_ids.append(user.firebase_id)
                    ChatUser.objects.create(user=user, chat_room=chat_room)

                notification_key = create_notification_group(room_id, registration_ids)
                chat_room.notification_key = notification_key
                chat_room.save()

                # 초대 및 방 개설 됨을 알려준다.
                group_notification(room_id, notification_key, 'system', '', participants)
                response['room_id'] = room_id
            else:
                chat_room = ChatRoom.objects.get(id=room_id)
                response['room_id'] = room_id

            str_participant = str()
            len_participant = len(participants)
            participants_info = list()
            for i, participant in enumerate(participants):
                user_dict = dict()
                user_dict['id'] = participant

                user = User.objects.get(username=participant)
                user_thumbnail_url = str(user.user_thumbnail)
                if user_thumbnail_url:
                    user_dict['profile_image'] = settings.SERVER_MEDIA_URL + user_thumbnail_url
                else:
                    user_dict['profile_image'] = settings.DEFULT_USER_THUMBNAIL_URL

                participants_info.append(user_dict)

                len_str_participant = len(str_participant)
                if len_str_participant + len(participant) >= 50:
                    if i == 0:
                        str_participant = participant
                    else:
                        continue
                elif i == len_participant - 1:
                    str_participant += participant
                else:
                    str_participant += participant + ', '

            if len_participants == 1:
                response['room_name'] = participants[0]
            else:
                if chat_room.is_single:
                    room_user = chat_room.chat_user.exclude(Q(user__username=my_username) |
                                                            Q(user__username='ceslea')).first()
                    response['room_name'] = str(room_user.user)
                else:
                    response['room_name'] = str_participant

            def extract_time(user_dict):
                return user_dict['id']

            participants_info.sort(key=extract_time)
            response['participants'] = participants_info
            response['mode'] = chat_room.bot_state

            cache.set("room_cm:" + room_id, chat_room.bot_state.lower())

    except IntegrityError:
        response['room_id'] = None
    except User.DoesNotExist:
        response['room_id'] = None
    except KeyError:
        response['room_id'] = None

    return JsonResponse(response, safe=False)


@csrf_exempt
def get_room_list(request):
    # room_name, room_id, room_last_message, room_last_message_date, room_image
    json_data = json.loads(request.body.decode('UTF8'))

    response = list()
    try:
        username = json_data['username']

        chat_user_objs = ChatUser.objects.filter(user__username=username)

        for chat_user in chat_user_objs.iterator():
            if chat_user.room_exit:
                continue

            chat_room = chat_user.chat_room
            chat_info = dict()
            chat_info['room_id'] = chat_room.id

            chat_info['participants'] = list()
            chat_info['room_image'] = list()
            room_user_obj = chat_room.chat_user.exclude(Q(room_exit=True) | Q(user__username='ceslea'))
            # 나혼자일 때,
            if room_user_obj.count() == 1:
                # 혹시나를 위해 남겨둠.
                # room_user = chat_room.chat_user.exclude(Q(user__username=username) |
                #                                         Q(user__username='ceslea')).order_by('-last_read_date').first()
                if chat_room.is_single:
                    room_user = chat_room.chat_user.exclude(Q(user__username=username) |
                                                            Q(user__username='ceslea')).first()
                    chat_info['room_name'] = str(room_user.user)
                    user_thumbnail_url = str(room_user.user.user_thumbnail)
                    if user_thumbnail_url:
                        chat_info['room_image'].append(settings.SERVER_MEDIA_URL + user_thumbnail_url)
                    else:
                        chat_info['room_image'].append(settings.DEFULT_USER_THUMBNAIL_URL)
                else: ## me chat
                    user = chat_user.user
                    chat_info['room_name'] = user.username  #"알 수 없음"
                    # chat_info['room_name'] = "undefined"
                    chat_info['participants'].append(user.username)
             
                    user_thumbnail_url = str(user.user_thumbnail)
                    if user_thumbnail_url != '':
                        chat_info['room_image'].append(settings.SERVER_MEDIA_URL + user_thumbnail_url)
                    else:
                        chat_info['room_image'].append(settings.DEFULT_USER_THUMBNAIL_URL)
                   
                    #chat_info['room_image'].append(settings.DEFULT_USER_THUMBNAIL_URL)
            else:
                str_participant = str()
                len_participant = room_user_obj.count() - 1
                user_count = 0

                for room_user in room_user_obj.iterator():
                    friend_name = str(room_user.user)

                    if friend_name == username:
                        continue

                    chat_info['participants'].append(friend_name)
                    user_thumbnail_url = str(room_user.user.user_thumbnail)
                    if user_thumbnail_url:
                        chat_info['room_image'].append(settings.SERVER_MEDIA_URL + user_thumbnail_url)
                    else:
                        chat_info['room_image'].append(settings.DEFULT_USER_THUMBNAIL_URL)

                    len_str_participant = len(str_participant)
                    if len_str_participant + len(friend_name) >= 50:
                        if user_count == 0:
                            str_participant = friend_name
                        else:
                            continue
                    elif user_count == len_participant - 1:
                        str_participant += friend_name
                    else:
                        str_participant += friend_name + ', '

                    user_count += 1

                if chat_room.is_single:
                    friend_obj = chat_room.chat_user.exclude(Q(user__username=username) | Q(user__username='ceslea'))
                    chat_info['room_name'] = str(friend_obj[0].user)
                else:
                    chat_info['room_name'] = str_participant

            try:
                # gte 버그 있음 .. 카운터 !! 라스트!!
                messages_info = chat_room.message.exclude(created_at__lt=chat_user.created_at)
                chat_info['room_count'] = messages_info.exclude(Q(author=username) |
                                                                Q(created_at__lt=chat_user.last_read_date)).count()
                last_message_obj = messages_info.latest('created_at')
                chat_info['room_last_message'] = last_message_obj.content
                chat_info['room_last_message_date'] = last_message_obj.created_at.strftime("%H:%M")
            except Message.DoesNotExist:
                chat_info['room_last_message'] = None
                chat_info['room_last_message_date'] = None

            response.append(chat_info)
    except ChatUser.DoesNotExist:
        logger.error("chatuser exist error")
    except KeyError:
        pass

    return JsonResponse(response, safe=False)


@csrf_exempt
def get_participants(request):
    json_data = json.loads(request.body.decode('UTF8'))
    response = dict()
    try:
        my_name = json_data['username']
        room_id = json_data['room_id']

        if room_id == '' or not room_id:
            response['result'] = 'False'
            return JsonResponse(response, safe=False)

        chat_room = ChatRoom.objects.get(id=room_id)
        chat_user_list = chat_room.chat_user.exclude(Q(user__username=my_name) | Q(room_exit=True))

        participants = list()
        str_participant = str()
        len_participant = chat_user_list.count() - 1
        user_count = 0
        for chat_user in chat_user_list:
            user_dict = dict()

            if str(chat_user.user) == "ceslea":
                continue

            user = chat_user.user
            friend_name = user.username
            user_dict['id'] = friend_name

            user_thumbnail_url = str(user.user_thumbnail)
            if user_thumbnail_url:
                user_dict['profile_image'] = settings.SERVER_MEDIA_URL + user_thumbnail_url
            else:
                user_dict['profile_image'] = settings.DEFULT_USER_THUMBNAIL_URL

            participants.append(user_dict)

            len_str_participant = len(str_participant)
            if len_str_participant + len(friend_name) >= 50:
                if user_count == 0:
                    str_participant = friend_name
                else:
                    continue
            elif user_count == len_participant - 1:
                str_participant += friend_name
            else:
                str_participant += friend_name + ', '

            user_count += 1

        def extract_time(user_json):
            return user_json['id']

        participants.sort(key=extract_time)

        response['room_name'] = str_participant
        response['participants'] = participants
        response['mode'] = chat_room.bot_state
        

    except ChatRoom.DoesNotExist:
        response = dict()
    except KeyError:
        response = dict()

    return JsonResponse(response, safe=False)


@csrf_exempt
def set_room_ceslea_mode(request):
    json_data = json.loads(request.body.decode('UTF8'))
    response = {'result': 'True'}
    try:
        room_id = json_data['room_id']
        mode = json_data['mode']

        chat_room = ChatRoom.objects.get(id=room_id)
        chat_room.bot_state = mode
        chat_room.save()

        cache.set("room_cm:" + room_id, mode.lower())

        text = "%s 모드로 변경 되었습니다." % mode
        # text = "Changed %s mode." % mode

        send_group_message(room_id, 'system', 'mode', chat_room, text)

    except ChatRoom.DoesNotExist:
        response['result'] = 'False'
    except KeyError:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)

@csrf_exempt
def set_room_ceslea_category(request):
    json_data = json.loads(request.body.decode('UTF8'))
    response = {'result': 'True'}
    try:
        room_id = json_data['room_id']
        category = json_data['category']

        chat_room = ChatRoom.objects.get(id=room_id)
        #chat_room.bot_category = category
        #chat_room.save()
        #cache.set("room_cm:" + room_id, category.lower())

        text = "%s 모드로 변경 되었습니다." % category
        # text = "Changed %s mode." % mode

        send_group_message(room_id, 'system', 'category', chat_room, text)

    except ChatRoom.DoesNotExist:
        response['result'] = 'False'
    except KeyError:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)


def send_group_message(room_id, author, type, chat_room, text, url='', keyword=''):
    content = dict()
    content['message'] = {
        'author': author,
        'content': text
    }

    if author == 'system':
        message = Message.objects.create(author=author, type=type, chat_room=chat_room, content=text)
        content['message']['type'] = type
        content['command'] = 'new_message'
        content['message']['emotion'] = ''
        content['message']['intent'] = '0'
        content['message']['intentdata'] = ''
    elif author == 'ceslea':
        message = Message.objects.create(author=author, chat_room=chat_room, content=text)

        content['command'] = 'ceslea_message'
        content['message']['type'] = 'message'
        content['cesType'] = type
        if type == 2:
            content['message']['url'] = url
            content['message']['keyword'] = keyword

    content['message']['id'] = str(message.id)
    content['message']['created_at'] = str(message.created_at.strftime("%H:%M")) # %Y-%m-%d %H:%M:%S

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(room_id, {
        'type': 'chat_message',
        'message': content
    })
    return str(message.id)


@csrf_exempt
def room_invite(request):
    json_data = json.loads(request.body.decode('UTF8'))
    response = {'result': 'True'}
    try:
        my = json_data['my']
        participants = json_data['participants']
        room_id = json_data['room_id']

        if room_id == '' or not room_id:
            response['result'] = 'False'
            return JsonResponse(response, safe=False)

        chat_room = ChatRoom.objects.get(id=room_id)
        notification_key = chat_room.notification_key

        registration_ids = list()
        invite_user = str()
        for participant in participants:
            user = User.objects.get(username=participant)
            chat_user, created = ChatUser.objects.get_or_create(user=user, chat_room=chat_room)

            if created:
                registration_ids.append(user.firebase_id)
                invite_user += '%s, ' % participant
            else:
                if chat_user.room_exit:
                    chat_user.room_exit = False
                    chat_user.room_join()
                    # chat_user.save()

                    registration_ids.append(user.firebase_id)
                    invite_user += '%s, ' % participant

        if len(registration_ids) > 0:
            for registration_id in set(registration_ids):
                chat_user = chat_room.chat_user.filter(user__firebase_id=registration_id)
                if chat_user.count() == 1:
                    notification_key = add_notification_group(room_id, notification_key, [registration_id])

                    if notification_key != '':
                        chat_room.notification_key = notification_key

            # 초대 및 방 개설 됨을 알려준다.
            group_notification(room_id, notification_key, 'system', '', participants)

            chat_room.is_single = False
            chat_room.save()

            str_len = len(invite_user)
            if str_len > 0:
                invite_user = invite_user[:str_len-2]
            text = '%s님이 %s님을 초대하였습니다.' %(my, invite_user)
            # eng_text = '%s invited %s.' %(my, invite_user)

            send_group_message(room_id, 'system', 'invite', chat_room, text)

            cache.set("room_nu:" + room_id, participants)

        chat_user_list = chat_room.chat_user.exclude(Q(user__username=my) | Q(room_exit=True))
        friend_list = list()
        for chat_user in chat_user_list:
            if str(chat_user.user) == "ceslea":
                continue

            user = chat_user.user
            friend_list.append(user.username)

        friend_list.sort()
        response['participants'] = friend_list

    except User.DoesNotExist:
        response['result'] = 'False'
    except ChatRoom.DoesNotExist:
        response['result'] = 'False'
    except KeyError:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)


@csrf_exempt
def room_exit(request):
    json_data = json.loads(request.body.decode('UTF8'))
    response = {'result': 'True'}
    try:
        username = json_data['username']
        room_id = json_data['room_id']

        chat_room = ChatRoom.objects.get(id=room_id)
        chat_user = ChatUser.objects.get(user__username=username, chat_room=chat_room)

        notification_key = chat_room.notification_key
        registration_id = chat_user.user.firebase_id

        filter_chat_user = chat_room.chat_user.filter(user__firebase_id=registration_id)
        if filter_chat_user.count() == 1:
            notification_key = remove_notification_group(room_id, notification_key, [registration_id])

            if notification_key != '':
                chat_room.notification_key = notification_key

        chat_user.room_exit = True
        chat_user.save()

        room_person_count = chat_room.chat_user.exclude(user__username='ceslea').count()
        room_exit_count = chat_room.chat_user.filter(room_exit=True).count()
        if room_person_count == room_exit_count:
            chat_room.delete()
        else:
            chat_room.save()

            text = '%s님이 채팅방을 나가셨습니다.' % (username)
            # eng_text = '%s left the chat room.' %(username)

            send_group_message(room_id, 'system', 'exit', chat_room, text)

    except ChatUser.DoesNotExist:
        response['result'] = 'False'
    except ChatRoom.DoesNotExist:
        response['result'] = 'False'
    except KeyError:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)

@csrf_exempt
def chat_summary(request):
    json_data = json.loads(request.body.decode('UTF8'))
    response = {'result': 'True'}
    try:
        room_id = json_data['room_id']
        chat_summary, created = ChatSummary.objects.get_or_create(chat_room_id=room_id)
        if created:
            chat_summary.content = 'test'
            chat_summary.save()
        else:
            response['result'] = 'False'

    except ChatSummary.DoesNotExist:
        response['result'] = 'False'
    except KeyError:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)

#set_file
@csrf_exempt
def set_file(request):
    response = {'result': 'True'}

    try:
        if request.method == 'POST':

            body_str = str(request.body)
            body_str = body_str.split('Content-Type:')
            body_temp = body_str[0]
            body_temp = body_temp.split('filename=')
            filename = body_temp[1]
            filename = filename.replace("\"","")
            filename = filename.replace("\\r\\n","")
            temp_id = filename.split('.')
            userId = temp_id[0]

            content_type = "multipart/form-data; boundary=*****"
            form_data  = decoder.MultipartDecoder(request.body, content_type)
             
            binary_content = []
            for part in form_data.parts:
                binary_content.append(part.content)
                                        
            path = 'media/profile_img/'+ filename
            if os.path.isfile(path):
                os.remove(path)

            f = open(path, 'wb')
            f.write(binary_content[0])
            f.close()
                        
            response = {'result': 'True','url':path}

        else:
            response['result'] = 'False'

    except Exception:
        response['result'] = 'exception'

    return JsonResponse(response, safe=False)    

@csrf_exempt
def get_unreadable_messages_count(request):
    json_data = json.loads(request.body.decode('UTF8'))
    response = {'result': 0}
    try:
        username = json_data['username']
        chat_user_objs = ChatUser.objects.filter(user__username=username)

        msg_cnt = 0
        for chat_user in chat_user_objs.iterator():
            if chat_user.room_exit:
                continue

            chat_room = chat_user.chat_room
            msg_cnt += chat_room.message.exclude(author=username).filter(
                        created_at__gte=chat_user.last_read_date).count()

        response['result'] = msg_cnt

    except KeyError:
        response['result'] = 0
    except ChatUser.DoesNotExist:
        response['result'] = 0

    return JsonResponse(response, safe=False)

@csrf_exempt
def ceslea_login(request):
    response = dict()
    try:
        if request.user.is_authenticated:
            response['access_token'] = request.session['access_token']
            response['refresh_token'] = request.session['refresh_token']
        else:
            post_data = request.POST
            ceslea_id = post_data['username']
            ceslea_pw = post_data['password']

            user = authenticate(username=ceslea_id, password=ceslea_pw)
            if user is not None:
                login(request, user)
                request.session['access_token'] = request.session.session_key
                request.session['refresh_token'] = request.session.session_key
                response['access_token'] = request.session['access_token']
                response['refresh_token'] = request.session['refresh_token']
            else:
                response['access_token'] = 'False'
                response['refresh_token'] = 'False'
    except Exception:
        response['access_token'] = 'False'
        response['refresh_token'] = 'False'
    return JsonResponse(response, safe=False)


def get_chat_event(request):
    response = {'events': list()}

    # 추후 나중에 세실리아 계정 인증 단계 구현 때 만들기
    # access_token = request.META['HTTP_AUTHORIZATION']
    # s_key = access_token.split(' ')[-1]
    # sess = SessionStore(session_key=s_key)
    # print(sess['access_token'])

    # 현재는 chat_room말고는 없다.
    if len(cache.keys("room_*")) == 0:
        return JsonResponse(response, safe=False)

    revisit_evt = cache.keys("room_rv:*")
    for revisit in revisit_evt:
        room_id = revisit.split(':')[-1]
        username = cache.get(revisit)

        chat_info = dict()
        chat_info['type'] = "chat.initbot"
        chat_info['chat'] = {'room': room_id}
        chat_info['chat']['user'] = username
        response['events'].append(chat_info)
        cache.delete(revisit)

    new_user_evt = cache.keys("room_nu:*")
    for new_user in new_user_evt:
        room_id = new_user.split(':')[-1]
        # 현재는 안씀 만약 여러개로 주면 세실리아가 한 룸에 여러번 요약본을 던져버림
        # username_list = cache.get(new_user)

        chat_info = dict()
        chat_info['type'] = "chat.join"
        chat_info['chat'] = {'room': room_id}
        # chat_info['chat']['user'] = username
        response['events'].append(chat_info)
        cache.delete(new_user)

    new_message_evt = cache.keys("room_nm:*")
    for new_message in new_message_evt:
        room_id = new_message.split(':')[-1]
        username, message_id = cache.get(new_message)

        chat_info = dict()
        chat_info['type'] = "chat.message"
        chat_info['chat'] = {'room': room_id}
        chat_info['chat']['user'] = username
        chat_info['chat']['msg'] = message_id
        response['events'].append(chat_info)
        cache.delete(new_message)
   
    ceslea_mode_evt = cache.keys("room_cm:*")
    for ceslea_mode in ceslea_mode_evt:
        room_id = ceslea_mode.split(':')[-1]
        mode = cache.get(ceslea_mode)

        chat_info = dict()
        chat_info['type'] = "chat.setting"
        chat_info['chat'] = {'room': room_id}
        chat_info['chat']['mode'] = mode
        response['events'].append(chat_info)
        cache.delete(ceslea_mode)

    intent_mode_evt = cache.keys("room_im:*")
    for intent_message in intent_mode_evt:
        room_id = intent_message.split(':')[-1]
        username, message_id = cache.get(intent_message)

        chat_info = dict()
        chat_info['type'] = "chat.message"
        chat_info['chat'] = {'room': room_id}
        chat_info['chat']['user'] = username
        chat_info['chat']['msg'] = message_id
        response['events'].append(chat_info)
        cache.delete(intent_message)

    return JsonResponse(response, safe=False)


@csrf_exempt
def fetch_message(request, room, msg):
    # 추후 나중에 세실리아 계정 인증 단계 구현 때 만들기
    # access_token = request.META['HTTP_AUTHORIZATION']
    # s_key = access_token.split(' ')[-1]
    # sess = SessionStore(session_key=s_key)
    # print(sess['access_token'])

    """
    return value
    {
    "user": 5, (원래는 유저번호 하지만 지금은 유저네임으로)
    "type": 1, >> 1일반 2파일 3초대 4퇴장  (현재는 일반만)
    "len": 3, (content 길이)
    "content": "메시지",
    "created": 1392319358 (생성시간)
    }

    """
    try:
        msg_obj = Message.objects.get(id=msg)
        content = msg_obj.content
        response = {'user': str(msg_obj.author),
                    'type': 1,
                    'len': len(content),
                    'content': content,
                    'created': msg_obj.created_at
                    }

    except Message.DoesNotExist:
        response = {'user': '',
                    'type': 1,
                    'len': 0,
                    'content': '',
                    'created': ''
                    }

    return JsonResponse(response, safe=False)


@csrf_exempt
def get_message(request, room, count, way=0, start=0):
    response = {'msgs': list()}
    """
    {
    "msgs": [
        {
            "msg": 1,
            "user": 1,
            "type": 1,  >> 1일반 2파일 3초대 4퇴장  (현재는 일반만)
            "len": 3,
            "content": "메시지",
            "tagfeeds": null, >> 태그 피드번호 (|로 구분, 비어있으면 태그 없음)
            "created": 1392319357,
            "file": {   >> 아직은 파일 전송 예정 없음
                "name": "1.txt",
                "size": 1,
                "id": "TASlYTQxM2YxYjhkN2E2Zg",
                "owner": null,
                "type": "normal"
            }
        },
    ]}
    """
    # way = 0 최신 / 1 이전 2 이후  // start 는 메세지 시작 번호
    messages = Message.objects.order_by('-created_at').filter(chat_room__id=room)
    if way == 0:
        for i, message in enumerate(messages.iterator()):
            msg_info = dict()
            if i == (count-1):
                break

            content = message.content

            msg_info['msg'] = message.id
            msg_info['user'] = str(message.author)
            msg_info['type'] = 1
            msg_info['len'] = len(content)
            msg_info['content'] = content
            msg_info['tagfeeds'] = None
            #msg_info['emotion'] = message.emotion
            #msg_info['intent'] = message.intent
            #msg_info['intentdata'] = message.intentdata
            msg_info['created'] = message.created_at

            response['msgs'].append(msg_info)

    return JsonResponse(response, safe=False)


@csrf_exempt
def send_message(request, room, type=1):
    # type 1 일반 // 2 파일
    json_data = json.loads(request.body.decode('UTF8'))
    try:
        chat_room = ChatRoom.objects.get(id=room)
        if type==1:
            content = json_data['content']
            if len(json_data) == 1:
                logger.error("111111111")
                message_id = send_group_message(room, 'ceslea', 1, chat_room, content)
            # 추가 정보 리스트 (type:1, tagfeeds:null)
            elif len(json_data) > 1:
                logger.error("3333333333333")
                extras = json_data['extras']
                """
                "2" : {
                    "type": "bot",
                    "message_buttons": [
                            {
                            "type": "url",
                            "button_text": "버튼 안의 텍스트",
                            "url": "https://google.com"
                            }
                        ]
                    }
                """
                ceslea_extras_answer = extras['2']['message_buttons'][0]
                a_url = ceslea_extras_answer['url']
                a_keyword = ceslea_extras_answer['button_text']
                message_id = send_group_message(room, 'ceslea', 2, chat_room, content, a_url, a_keyword)
        else:
            content = json_data['content']
            tagfeeds = json_data['tagfeeds']
            message_id = "0"

        if message_id:
            response = {'msg': message_id}
        else:
            response = {'msg': None}

    except ChatRoom.DoesNotExist:
        return JsonResponse({'msg':None}, status=403)
    except ChatUser.DoesNotExist:
        return JsonResponse({'msg': None}, status=403)
    except KeyError:
        return JsonResponse({'msg': None}, status=403)

    return JsonResponse(response, safe=False)
