from django.http import JsonResponse
from django.contrib.auth import login, authenticate, logout
from django.views.decorators.csrf import csrf_exempt
from user.models import User, FriendList
from chat_bot_server import settings
from chat_bot_server.notification import add_notification_group, remove_notification_group
from channels_app.models import ChatUser
from grpc_wrapper.client import create_client
from requests_toolbelt.multipart import decoder
import json
import requests
import os

@csrf_exempt
def register(request):
    response = {'result': 'True'}
    try:
        json_data = json.loads(request.body.decode('UTF8'))
        user_id = json_data['id']
        password = json_data['pw']
        user_name = json_data['name']
        phone_number = '010-1234-5678'  #json_data['phone_number']

        user = User.objects.filter(username=user_id)
        if user.exists() or user_id.lower() == 'admin' or user_id.lower() == 'system'\
            or user_id.lower() == 'ceslea':
            response['result'] = 'False'
        else:
            user, created = User.objects.get_or_create(username=user_id)
            if created:
                user.set_password(password)
                user.email = user_id
                user.is_name = user_name
                user.phone_number = phone_number
                user.save()
                login(request, user)
            else:
                response['result'] = 'False'
    except Exception:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)


@csrf_exempt
def user_login(request):
    response = {'result': 'True'}
    try:
        json_data = json.loads(request.body.decode('UTF8'))
        user_id = json_data['id']
        password = json_data['pw']
        firebase_id = json_data['token']

        user = authenticate(username=user_id, password=password)
        if user is not None:
            login(request, user)

            if user.firebase_id != firebase_id:
                old_firebase_id = user.firebase_id
                user.firebase_id = firebase_id
                user.save()

                chat_user_list = ChatUser.objects.filter(user=user)
                for chat_user in chat_user_list.iterator():
                    chat_room = chat_user.chat_room
                    notification_key = chat_room.notification_key
                    room_id = str(chat_user.chat_room.id)

                    notification_key = remove_notification_group(room_id, notification_key, [old_firebase_id])

                    chat_user = chat_room.chat_user.filter(user__firebase_id=firebase_id)
                    if chat_user.count() == 1:
                        notification_key = add_notification_group(room_id, notification_key, [firebase_id])

                    chat_room.notification_key = notification_key
                    chat_room.save()

            # response['sessionid'] = request.session.session_key
            # response['csrftoken'] = 'Xw4S18nsLHSBYKfEgX7PgMTHtKjxS48nF2le0UIdLJwH0UgewewsOwPYF1V34EfY'

            response['is_name'] = user.is_name
            response['status_message'] = user.status_message
            # response['name'] = user.name

            user_thumbnail_url = str(user.user_thumbnail)
            if user_thumbnail_url:
                response['profile_image'] = settings.SERVER_MEDIA_URL + user_thumbnail_url
            else:
                response['profile_image'] = settings.DEFULT_USER_THUMBNAIL_URL

        else:
            response['result'] = 'False'

    except KeyError:
        response['result'] = 'False'
    except User.DoesNotExist:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)


@csrf_exempt
def user_logout(request):
    logout(request)
    response = {'result': 'True'}
    try:
        json_data = json.loads(request.body.decode('UTF8'))
        username = json_data['id']

        user = User.objects.get(username=username)
        firebase_id = user.firebase_id
        chat_user_list = ChatUser.objects.filter(user=user)

        for chat_user in chat_user_list.iterator():
            chat_room = chat_user.chat_room
            notification_key = chat_room.notification_key
            room_id = str(chat_user.chat_room.id)

            chat_user = chat_room.chat_user.filter(user__firebase_id=firebase_id)
            if chat_user.count() == 1:
                notification_key = remove_notification_group(room_id, notification_key, [firebase_id])
                if notification_key != '':
                    chat_room.notification_key = notification_key
                    chat_room.save()

        # 현재는 지우지 않는다.
        # user.firebase_id = ''
        # user.save()
    except Exception:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)


@csrf_exempt
def set_profile(request):
    response = {'result': 'True'}
    try:
        #if request.method == 'POST':

        json_data = json.loads(request.body.decode('UTF8'))
        username = json_data['id']
        status_message = json_data['status_message']

        #    username = request.POST['username']
        #    status_message = request.POST['status_message']
        #    user_thumbnail = request.FILES['filename']

        user = User.objects.get(username=username)
        #    user.user_thumbnail = user_thumbnail
        user.status_message = status_message
        user.save()
        #else:
        #    response['result'] = 'False'*/
    except Exception:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)

@csrf_exempt
def set_photo(request):
    response = {'result': 'True'}

    try:
        if request.method == 'POST':

            #fileName = request.body.form.get('fileName','')
            #userId = request.form['userId']

            body_str = str(request.body)
            body_str = body_str.split('Content-Type:')
            body_temp = body_str[0]
            body_temp = body_temp.split('filename=')
            filename = body_temp[1]
            filename = filename.replace("\"","")
            filename = filename.replace("\\r\\n","")
            # temp_id = str[:-4] #filename.split('.')
            userId = filename[:-4]  #temp_id[0]
            
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
            
            user_thumbnail = 'profile_img/' + filename
            user = User.objects.get(username=userId)
            user.user_thumbnail = user_thumbnail
            user.save()
            
            response = {'result': 'True','url':path}

        else:
            response['result'] = 'False'

    except Exception:
        response['result'] = 'exception'

    return JsonResponse(response, safe=False)

#set_photo_delete
@csrf_exempt
def set_photo_delete(request):
    response = {'result': 'True'}
    try:
        json_data = json.loads(request.body.decode('UTF8'))
        my_id = json_data['id']
        filename = json_data['filename']

        path = 'media/profile_img/'+ filename
        if os.path.isfile(path):
            os.remove(path)

        user = User.objects.get(username=my_id)
        user.user_thumbnail = ''
        user.save()

        response['result'] = 'True'

    except Exception:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)

@csrf_exempt
def set_chat_test(request):
    response = {'result': ''}

    try:
        json_data = json.loads(request.body.decode('UTF8'))
        text = json_data['text']
        lan = json_data['lan']       

        f = open('myfile.txt', mode='wt', encoding='utf-8')
        f.write(text)
        f.close()

        if lan =='ko-KR':            
            # files = {'file': open('myfile.txt', 'rb'),'filename': 'myfile.txt','content-Type': 'text/xml'}
             # result = requests.post("https://chat.neoali.com:8072/summary_kor", files=files)
            result = requests.post("https://chat.neoali.com:8072/summary_kor", data = text, headers ={'content-Type': 'text/xml'})
            # json_contents = json.loads(result.text)
            response['result'] =  'test'# str(json_contents['content'])

        elif lan == 'en-US':
            # files = {'file': open('myfile.txt', 'rb'),'filename': 'myfile.txt','content-Type': 'text/xml'}
            # result = requests.post("https://chat.neoali.com:8072/summary_short", files=files)
            result = requests.post("https://chat.neoali.com:8072/summary_short", data = text, headers ={'content-Type': 'text/xml'})
            # json_contents = json.loads(result.text)
            response['result'] = 'test' #str(json_contents['content'])

        #client = create_client("155.230.24.108", 60005)    
        #result = client.send({'sentence': 'hello', 'act':1})

        """
        client = create_client("155.230.27.179", 50069)    
        client.send({'roomState':0, 'roomId':999, 'sentence': 'null'})
        result = client.send({'roomState':2, 'roomId':999, 'sentence': 'hello'})
        response['result'] = str(result)
        """

        """
        client = create_client("155.230.24.108", 60008)    
        result = client.send({'name': 'aaa', 'query':'who are you?'})
        """
        """
        client = create_client("155.230.24.108", 60009)
        result = client.send({'sentence': 'korea'})
        """
        """
        client = create_client("155.230.24.108", 40001)
        result = client.send({'sentence': '안녕'})
        """
        """
        client = create_client("155.230.24.108", 40008)
        result = client.send({'sentence': '안녕', 'act':1})
        """

        """
        client = create_client("155.230.27.179", 50069)
        result = client.send({'sentence': '안녕'})
        response['result'] = str(result)
        """
    except Exception:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)

@csrf_exempt
def add_me(request):
    response = {'result': 'True'}
    try:
        json_data = json.loads(request.body.decode('UTF8'))
        my_id = json_data['id']
        friend_id = json_data['add']

        my_profile = User.objects.get(username=my_id)
        fri_profile = User.objects.get(username=friend_id)

        _, created = my_profile.my.get_or_create(friend=fri_profile)
        if created:
            response['result'] = 'True'
        else:
            # 원래는 친구가 이미 추가 되어 있다고 보내야됨
            response['result'] = 'Overlap'

    except Exception:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)


@csrf_exempt
def add_friend(request):
    response = {'result': 'True'}
    try:
        json_data = json.loads(request.body.decode('UTF8'))
        my_id = json_data['id']
        friend_id = json_data['add']

        if my_id == friend_id:
            response['result'] = 'False'
        else:
            my_profile = User.objects.get(username=my_id)
            fri_profile = User.objects.get(username=friend_id)

            _, created = my_profile.my.get_or_create(friend=fri_profile)
            if created:
                response['result'] = 'True'
            else:
                # 원래는 친구가 이미 추가 되어 있다고 보내야됨
                response['result'] = 'Overlap'

    except Exception:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)


@csrf_exempt
def del_friend(request):
    response = {'result': 'True'}
    try:
        json_data = json.loads(request.body.decode('UTF8'))
        my_id = json_data['id']
        friend_id = json_data['delete']

        my_obj = User.objects.get(username=my_id)
        fri_obj = User.objects.get(username=friend_id)

        try:
            friend_obj = my_obj.my.get(friend=fri_obj)
            friend_obj.delete()
            response['result'] = 'True'
        except FriendList.DoesNotExist:
            response['result'] = 'False'
    except Exception:
        response['result'] = 'False'

    return JsonResponse(response, safe=False)


@csrf_exempt
def get_friend(request):
    response_friend_list = list()
    try:
        json_data = json.loads(request.body.decode('UTF8'))
        my_id = json_data['id']

        my_user = User.objects.get(username=my_id)
        friend_obj_list = my_user.my.order_by('-pk')

        for friend_obj in friend_obj_list:
            fri_dict = dict()

            friend_user = friend_obj.friend
            fri_dict['id'] = friend_user.username
            fri_dict['is_name'] = friend_user.is_name
            fri_dict['status_message'] = friend_user.status_message

            user_thumbnail_url = str(friend_user.user_thumbnail)
            if user_thumbnail_url:
                fri_dict['profile_image'] = settings.SERVER_MEDIA_URL + user_thumbnail_url
            else:
                fri_dict['profile_image'] = settings.DEFULT_USER_THUMBNAIL_URL

            response_friend_list.append(fri_dict)

        response_friend_list.sort(key=extract_time)
    except Exception:
        pass

    return JsonResponse(response_friend_list, safe=False)


def extract_time(fri_json):
    return fri_json['id']