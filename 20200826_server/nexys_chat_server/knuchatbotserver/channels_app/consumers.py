import json
import logging

from django.core.cache import cache
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.db.models import Q

from channels_app.models import Message, ChatUser, ChatRoom
from channels_app.tasks import set_last_message_read
from chat_bot_server import settings
from chat_bot_server.notification import group_notification
from user.models import User
from grpc_wrapper.client import create_client

logger = logging.getLogger(__name__)


class ChatConsumer(WebsocketConsumer):
    def init_chat(self, data):
        content = {'command': 'init_chat'}
        try:
            username = data['username']
            room_id = data['room_id']
            phone_state = data['state']

            chat_user = ChatUser.objects.get(user__username=username, chat_room__id=room_id)
            chat_user.online = True
            chat_user.save()

            # Join room group
            async_to_sync(self.channel_layer.group_add)(
                room_id,
                self.channel_name
            )

            if not phone_state:
                cache.set("room_rv:" + room_id, username)

            self.scope['user'] = username
            self.scope['room_id'] = room_id
            self.scope['user_phone_state'] = phone_state

            content['result'] = 'Success init chat.'
        except ChatUser.DoesNotExist:
            content['result'] = 'Fail init chat.'
        except KeyError:
            content['result'] = 'Fail init chat.'
        self.send_message(content)

    def fetch_messages(self, data):
        content = {'command': 'fetch_messages', 'messages': []}
        try:
            room_id = self.scope['room_id']
            username = self.scope['user']
            pos = data['pos']
            message_id = data['msgId']

            chat_room = ChatRoom.objects.get(id=room_id)
            chat_user = ChatUser.objects.get(chat_room=chat_room, user__username=username)
            create_chat_user = chat_user.created_at
            last_read_date = chat_user.last_read_date

            message_size = 50
            if message_id == "0" or message_id == '':
                up_messages = chat_room.message.exclude(Q(created_at__gt=last_read_date) |
                                                        Q(created_at__lte=create_chat_user)
                                                        ).order_by('-created_at').reverse()

                down_messages = chat_room.message.exclude(created_at__lte=last_read_date).order_by('created_at')

                message_size //= 2

                if message_size < up_messages.count():
                    content['upLast'] = 'False'
                    up_messages = up_messages[(up_messages.count() - message_size):]
                else:
                    content['upLast'] = 'True'

                for i, message in enumerate(up_messages.iterator()):
                    content['messages'].append(self.message_to_json(message))

                if message_size < down_messages.count():
                    content['downLast'] = 'False'
                    down_messages = down_messages[:message_size]
                else:
                    content['downLast'] = 'True'

                for i, message in enumerate(down_messages.iterator()):
                    content['messages'].append(self.message_to_json(message))
            else:
                message = Message.objects.get(id=message_id)
                message_date = message.created_at

                if pos == 'down':
                    messages = chat_room.message.exclude(created_at__lte=message_date).order_by('created_at')

                    if message_size < messages.count():
                        content['downLast'] = 'False'
                        messages = messages[:message_size]
                    else:
                        content['downLast'] = 'True'
                        
                    content['upLast'] = self.scope['up_last']
                elif pos == 'up':
                    messages = chat_room.message.exclude(Q(created_at__gte=message_date) |
                                                         Q(created_at__lt=create_chat_user)
                                                         ).order_by('-created_at').reverse()

                    message_cnt = messages.count()
                    if message_size < message_cnt:
                        content['upLast'] = 'False'
                        messages = messages[(message_cnt-message_size):]
                    else:
                        content['upLast'] = 'True'

                    content['downLast'] = self.scope['down_last']
                else:
                    up_messages = chat_room.message.exclude(Q(created_at__gt=message_date) |
                                                         Q(created_at__lt=create_chat_user)
                                                         ).order_by('-created_at').reverse()

                    if self.scope['user_phone_state']:
                        up_messages = up_messages.exclude(created_at__lte=last_read_date)

                    down_messages = chat_room.message.exclude(created_at__lte=message_date).order_by('created_at')

                    message_size //= 2

                    if message_size < up_messages.count():
                        content['upLast'] = 'False'
                        up_messages = up_messages[(up_messages.count()-message_size):]
                    else:
                        content['upLast'] = 'True'

                    for i, message in enumerate(up_messages.iterator()):
                        content['messages'].append(self.message_to_json(message))

                    if message_size < down_messages.count():
                        content['downLast'] = 'False'
                        down_messages = down_messages[:message_size]
                    else:
                        content['downLast'] = 'True'

                    for i, message in enumerate(down_messages.iterator()):
                        content['messages'].append(self.message_to_json(message))

            if pos != 'normal':
                for i, message in enumerate(messages.iterator()):
                    content['messages'].append(self.message_to_json(message))

            content['result'] = 'True'

            self.scope['up_last'] = content['upLast']
            self.scope['down_last'] = content['downLast']
        except KeyError:
            content['result'] = 'False'
        except ChatRoom.DoesNotExist:
            content['result'] = 'False'
            logger.error("Fetch Error!! - chat room")
        except Message.DoesNotExist:
            content['result'] = 'False'
            logger.error("Fetch Error!! - message")
        except Exception as e:
            content['resut'] = 'False'
            logger.error("Fetch Error!! - " + str(e))

        self.send_message(content)

    def new_message(self, data):
        content = {'command': 'new_message'}
        try:
            username = self.scope['user']
            room_id = self.scope['room_id']

            text = data['text']
            lan = data['lan']

            chat_room = ChatRoom.objects.get(id=room_id)
            message = Message.objects.create(author=username, chat_room=chat_room, content=text)
            content['message'] = self.message_to_json(message)

            if chat_room.bot_state == 'MAX' or chat_room.bot_state == 'SEMI':

                # intent
                if lan =='ko-KR':
                    client = create_client("155.230.24.108", 50069)    
                    client.send({'roomState':0, 'roomId':999, 'sentence': 'null'})
                    result = client.send({'roomState':2, 'roomId':999, 'sentence': text}) 

                    if result is None or str(result) == '':
                        content['message']['intent'] = '0'
                    else :
                        textStr = str(result)
                        textStr = textStr.replace("{","")
                        textStr = textStr.replace("}","")
                        textStr = textStr.replace("\'","")
                        textStr = textStr.replace("\"","")
                        textArr = textStr.split(':')
                        if len(textArr) > 1:
                            textStr = textArr[1].replace(" ","")
                        else :
                            textStr = '0'
                            
                        content['message']['intent'] = str(textStr)
                        
                        if str(textStr) == '1':
                            content['message']['intentdata'] = '제가 그 지도 정보를 보여드릴까요? 어느 지역을 보여드릴까요? 지역을 입력해주세요.'
                        elif str(textStr) == '2':
                            content['message']['intentdata'] = '제가 입력하신 동영상을 보여드릴까요? 유튜브에서 어떤 동영상을 보여드릴까요? 키워드를 말씀해주세요.'
                        elif str(textStr) == '3':
                            content['message']['intentdata'] = '제가 그 이메일 정보를 보여드릴까요? 이메일을 누구에게 보내시겠어요? 보내실 이메일 주소를 입력해주세요.'
                        elif str(textStr) == '4':
                            content['message']['intentdata'] = '제가 캘린더를 보여드릴까요? 누구의 캘린더를 보여드릴까요?'
                        elif str(textStr) == '5':
                            content['message']['intentdata'] = '제가 주소록 정보를 드릴까요? 누구의 연락처를 보여드릴까요? 이름을 입력해주세요.'
                        elif str(textStr) == '6':
                            content['message']['intentdata'] = '제가 위키피디아를 보여드릴까요? 위키피디아에서 어떤 것을 검색해드릴까요? 키워드를 입력해주세요.'
                        elif str(textStr) == '7':
                            content['message']['intentdata'] = '제가 그 지역의 날씨정보를 보여드릴까요? 어디 지역의 날씨를 보여드릴까요?'
                        elif str(textStr) == '8':
                            content['message']['intentdata'] = '제가 그 호텔에 대한 정보를 보여드릴까요? 어디 지역의 호텔을 찾아드릴까요? 위치를 말씀해주세요.'
                        elif str(textStr) == '9':
                            content['message']['intentdata'] = '제가 항공 정보 사이트를 띄워드릴까요? 어디로 떠나고 싶으세요? 여행하고 싶으신 지역의 공항 위치를 말씀해주세요.'
                        elif str(textStr) == '10':
                            content['message']['intentdata'] = '제가 아마존 쇼핑 정보를 보여드릴까요? 아마존에서 무엇을 구매하고 싶으신가요? 구매하고 싶으신 키워드를 입력해주세요.'
                        elif str(textStr) == '11':
                            content['message']['intentdata'] = '제가 입력하신 식당에 대한 정보를 보여드릴까요? 어떤 음식을 먹고 싶으신가요? 키워드를 입력해주세요.'
                        elif str(textStr) == '12':
                            content['message']['intentdata'] = '제가 그 질의응답을 만들어봐도 될까요? 어떤 질문을 하고 싶으신가요? 키워드를 입력해주시면 답변해드리겠습니다.'
                        elif str(textStr) == '13':
                            content['message']['intentdata'] = '제가 문(door)을 보여드릴까요? 어떤 종류의 문을 원하시나요? 키워드를 입력해주세요.'
                        elif str(textStr) == '14':
                            content['message']['intentdata'] = '제가 그 신문 기사를 보여드릴까요? 신문 주제로 어떤것을 찾으시나요? 주제를 입력해주세요.'
                        elif str(textStr) == '15':
                            content['message']['intentdata'] = '제가 그 영화 정보를 보여드릴까요? 어떤 영화를 보고 싶으세요? 영화 제목을 입력해주세요.'
                        elif str(textStr) == '16':
                            content['message']['intentdata'] = '제가 그 주식에 대한 정보를 보여드릴까요? 어떤 회사의 주식을 찾고 계신가요? 주식 종목을 입력해주세요.'
                        elif str(textStr) == '17':
                            content['message']['intentdata'] = '제가 입력하신 문장에 대한 요약을 해드릴까요? 대화 요약 서비스로 안내해드릴까요?'
                        elif str(textStr) == '18':
                            content['message']['intentdata'] = '제가 격려해드려도 될까요? 격려에 도움이 되는 웹페이지를 보여드릴까요?'
                        elif str(textStr) == '19':
                            content['message']['intentdata'] = '제가 원하시는 스포츠를 보여드릴까요? 어떤 주제의 스포츠가 보고 싶으신가요? 키워드를 입력해주세요.'
                        elif str(textStr) == '20':
                            content['message']['intentdata'] = '제가 그 책 정보를 보여드릴까요? 어떤 주제의 책을 보여드릴까요? 주제를 입력해주세요.'
                        else :
                            content['message']['intentdata'] = ''


                elif lan == 'en-US':
                    client = create_client("155.230.24.108", 50059)    
                    client.send({'roomState':0, 'roomId':999, 'sentence': 'null'})
                    result = client.send({'roomState':2, 'roomId':999, 'sentence': text}) 

                    if result is None or str(result) == '':
                        content['message']['intent'] = '0'
                    else :
                        textStr = str(result)
                        textStr = textStr.replace("{","")
                        textStr = textStr.replace("}","")
                        textStr = textStr.replace("\'","")
                        textStr = textStr.replace("\"","")
                        textArr = textStr.split(':')
                        if len(textArr) > 1:
                            textStr = textArr[1].replace(" ","")
                        else :
                            textStr = '0'
                            
                        content['message']['intent'] = str(textStr)
                        
                        if str(textStr) == '1':
                            content['message']['intentdata'] = 'Can I show you the map information? Which area would you like to show you? Please enter a region.'
                        elif str(textStr) == '2':
                            content['message']['intentdata'] = 'Shall I show you the video you entered? What videos do you want to show on YouTube? Please tell me your keywords.'
                        elif str(textStr) == '3':
                            content['message']['intentdata'] = 'Can I show you the email information? Who would you like to send the email to? Please enter the email address to send.'
                        elif str(textStr) == '4':
                            content['message']['intentdata'] = 'Shall I show you the calendar? Whose calendar can I show you?'
                        elif str(textStr) == '5':
                            content['message']['intentdata'] = 'Can I give you the contact information? Whose contact can I show you? Input your name, please.'
                        elif str(textStr) == '6':
                            content['message']['intentdata'] = 'Shall I show you Wikipedia? What would you like to search for on Wikipedia? Please enter a keyword.'
                        elif str(textStr) == '7':
                            content['message']['intentdata'] = 'Can I show you the weather information for that area? Where can I show you the local weather?'
                        elif str(textStr) == '8':
                            content['message']['intentdata'] = 'Can I show you some information about the hotel? Where can I find a hotel in the area? Please tell me the location.'
                        elif str(textStr) == '9':
                            content['message']['intentdata'] = 'Shall I launch an airline information site? Where do you want to go? Please tell me the location of the airport in the area you want to travel to.'
                        elif str(textStr) == '10':
                            content['message']['intentdata'] = 'Can I show you Amazon shopping information? What would you like to buy on Amazon? Please enter the keyword you want to purchase.'
                        elif str(textStr) == '11':
                            content['message']['intentdata'] = 'Would you like to show you the information about the restaurant you entered? What kind of food would you like to eat? Please enter a keyword.'
                        elif str(textStr) == '12':
                            content['message']['intentdata'] = 'Can I make the question and answer? What question do you want to ask? Please enter your keywords and I will answer you.'
                        elif str(textStr) == '13':
                            content['message']['intentdata'] = 'Shall I show you the door? What kind of door do you want? Please enter a keyword.'
                        elif str(textStr) == '14':
                            content['message']['intentdata'] = 'Shall I show you the newspaper article? What are you looking for on a newspaper topic? Please enter a subject.'
                        elif str(textStr) == '15':
                            content['message']['intentdata'] = 'Can I show you the movie information? Which movie would you like to see? Please enter the movie title.'
                        elif str(textStr) == '16':
                            content['message']['intentdata'] = 'Can I show you some information about the stock? What company are you looking for? Please enter the stock item.'
                        elif str(textStr) == '17':
                            content['message']['intentdata'] = 'May I give you a summary of the sentence you entered? Can I guide you to the conversation summary service?'
                        elif str(textStr) == '18':
                            content['message']['intentdata'] = 'Can I encourage you? Would you like to show you a web page to help you encourage?'
                        elif str(textStr) == '19':
                            content['message']['intentdata'] = 'Shall I show you the sport you want? What kind of sports would you like to see? Please enter a keyword.'
                        elif str(textStr) == '20':
                            content['message']['intentdata'] = 'Can I show you the information for that book? What topics would you like to show you? Please enter a subject.'
                        else :
                            content['message']['intentdata'] = ''                
                                    
                if lan =='ko-KR':
                    client = create_client("155.230.24.108", 50068)    
                    client.send({'roomState':0, 'roomId':999, 'sentence': 'null'})
                    result = client.send({'roomState':2, 'roomId':999, 'sentence': text})
                elif lan == 'en-US':
                    client = create_client("155.230.24.108", 50058)    
                    client.send({'roomState':0, 'roomId':999, 'sentence': 'null'})
                    result = client.send({'roomState':2, 'roomId':999, 'sentence': text})
                else :
                    result = ''
                
                if result is None or str(result) == '':
                    content['message']['emotion'] = ''
                else :
                    ret = str(result)
                    ret = ret.replace("\'","\"")
                    json_data = json.loads(ret)
                    ret = json_data['output']
                    content['message']['emotion'] = str(ret)
            else :
                content['message']['emotion'] = ''
                content['message']['intent'] = '0'

            cache.set("room_nm:" + room_id, (username, message.id))
            self.send_chat_message(content, room_id)
            group_notification(room_id, chat_room.notification_key, username, text)    
            
        except ChatUser.DoesNotExist:
            content['result'] = 'Fail new messages.(chat user)'
            self.send_message(content)
        except ChatRoom.DoesNotExist:
            content['result'] = 'Fail new messages. (chat room)'
            self.send_message(content)
        except User.DoesNotExist:
            content['result'] = 'Fail new messages. (user)'
            self.send_message(content)
        except KeyError:
            content['result'] = 'Fail new messages. (key error)'
            self.send_message(content)

    def file_message(self, data):
        content = {'command': 'file_message'}
        try:
            username = self.scope['user']
            room_id = self.scope['room_id']
            text = data['text']

            chat_room = ChatRoom.objects.get(id=room_id)
            message = Message.objects.create(author=username, type='file', chat_room=chat_room, content=text)
            content['message'] = self.message_to_json(message)
            
            cache.set("room_nm:" + room_id, (username, message.id))
            self.send_chat_message(content, room_id)
            group_notification(room_id, chat_room.notification_key, username, text)    
            
        except ChatUser.DoesNotExist:
            content['result'] = 'Fail file messages.(chat user)'
            self.send_message(content)
        except ChatRoom.DoesNotExist:
            content['result'] = 'Fail file messages. (chat room)'
            self.send_message(content)
        except User.DoesNotExist:
            content['result'] = 'Fail file messages. (user)'
            self.send_message(content)
        except KeyError:
            content['result'] = 'Fail file messages. (key error)'
            self.send_message(content)

    def intent_message(self, data):
        content = {'command': 'intent_message'}
        try:
            username = self.scope['user']
            room_id = self.scope['room_id']
            text = data['text']
            intent = data['intent']
            lan = data['lan']

            chat_room = ChatRoom.objects.get(id=room_id)
            message = Message.objects.create(author=username, chat_room=chat_room, content=text)
            content['message'] = self.message_to_json(message)

            content['message']['intent'] = intent

            #text = "%s 모드로 변경 되었습니다." % category

            if intent == '1':
                content['message']['intentdata'] = "https://www.google.com/maps/search/?api=1&query=%s" % text
            elif intent == '2':
                content['message']['intentdata'] = "https://www.youtube.com/results?search_query=%s" % text
            elif intent == '3':
                content['message']['intentdata'] = "https://mail.google.com"
            elif intent == '4':
                content['message']['intentdata'] = "https://www.google.com/calendar"
            elif intent == '5':
                content['message']['intentdata'] = "https://contacts.google.com/search/%s" % text
            elif intent == '6':
                content['message']['intentdata'] = "https://en.wikipedia.org/wiki/%s" % text
            elif intent == '7':
                content['message']['intentdata'] = "https://search.naver.com/search.naver?sm=top_hty&fbm=0&ie=utf8&query=%s" % text
            elif intent == '8':
                content['message']['intentdata'] = "https://www.hotelscombined.co.kr/Place/%s" % text
            elif intent == '9':
                content['message']['intentdata'] = "https://www.skyscanner.co.kr"
            elif intent == '10':
                content['message']['intentdata'] = "https://www.amazon.com/s/ref=nb_sb_noss_2?url=search-alias%3Daps&field-keywords=%s" % text
            elif intent == '11':
                content['message']['intentdata'] = "https://search.naver.com/search.naver?sm=top_hty&fbm=0&ie=utf8&query=%s" % text
            elif intent == '12':
                content['message']['intentdata'] = "https://kin.naver.com/search/list.nhn?query=%s" % text
            elif intent == '13':
                content['message']['intentdata'] = "https://www.textures.com/category/doors/148"
            elif intent == '14':
                content['message']['intentdata'] = "https://search.naver.com/search.naver?query=%s&where=news" % text
            elif intent == '15':
                content['message']['intentdata'] = "https://movie.naver.com/movie/search/result.nhn?query=%s" % text
            elif intent == '16':
                content['message']['intentdata'] = "https://m.stock.naver.com/searchItem.nhn?keyword_input=&keyword=%s" % text
            elif intent == '17':
                content['message']['intentdata'] = "https://chat.neoali.com:8074/"
            elif intent == '18':
                content['message']['intentdata'] = "https://search.naver.com/search.naver?query=%s" % text
            elif intent == '19':
                content['message']['intentdata'] = "https://sports.news.naver.com/"
            elif intent == '20':
                content['message']['intentdata'] = "https://book.naver.com/search/search.nhn?sm=sta_hty.book&sug=&where=nexearch&query=%s" % text
            else :
                content['message']['intentdata'] = '...'           

            cache.set("room_im:" + room_id, (username, message.id))
            self.send_chat_message(content, room_id)
            group_notification(room_id, chat_room.notification_key, username, text)    

        except ChatUser.DoesNotExist:
            content['result'] = 'Fail ceslea message.(chat user)'
            self.send_message(content)
        except ChatRoom.DoesNotExist:
            content['result'] = 'Fail ceslea message. (chat room)'
            self.send_message(content)
        except User.DoesNotExist:
            content['result'] = 'Fail ceslea message. (user)'
            self.send_message(content)
        except KeyError:
            content['result'] = 'Fail ceslea message. (key error)'
            self.send_message(content)

    def ceslea_message(self, data):
        content = {'command': 'ceslea_message'}
        try:
            username = 'ceslea' #self.scope['user']
            room_id = self.scope['room_id']
            text = data['text']
            mode = data['mode']

            try:

                if mode =='chitchat-en':
                    client = create_client("155.230.24.108", 60005)    
                    result = client.send({'sentence': text, 'act':1})

                    chat_room = ChatRoom.objects.get(id=room_id)
                    if result is None or str(result) == '':
                        text = 'error'
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)
                        
                    else :
                        text = str(result)
                        text = text.replace("{","")
                        text = text.replace("}","")
                        textArr = text.split(':')
                        if len(textArr) > 1:
                            text = textArr[1]
                        #json_data = json.loads(text)
                        #text = json_data['output']
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)
                        
                elif mode =='scenario-en':
                    name = self.scope['user']
                    client = create_client("155.230.24.108", 60008)    
                    result = client.send({'name': name, 'query':text})

                    chat_room = ChatRoom.objects.get(id=room_id)
                    if result is None or str(result) == '':
                        text = 'error'
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)
                        
                    else :
                        text = str(result)
                        text = text.replace("{","")
                        text = text.replace("}","")
                        textArr = text.split(':')
                        if len(textArr) > 1:
                            text = textArr[1]
                        #text = text.replace("\'","\"", 2)
                        #json_data = json.loads(text)
                        #text = json_data['sentence']
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)
                                        
                elif mode =='travel-en':
                    client = create_client("155.230.24.108", 60009)
                    result = client.send({'sentence': text })

                    chat_room = ChatRoom.objects.get(id=room_id)
                    if result is None or str(result) == '':
                        text = 'error'
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)
                    else :
                        text = str(result)
                        text = text.replace("{","")
                        text = text.replace("}","")
                        textArr = text.split(':')
                        if len(textArr) > 1:
                            text = textArr[1]
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)

                elif mode =='chest-ko':
                    client = create_client("155.230.24.108", 40001)
                    result = client.send({'sentence': text})

                    chat_room = ChatRoom.objects.get(id=room_id)
                    if result is None or str(result) == '':
                        text = 'error'
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)
                    else :
                        text = str(result)
                        text = text.replace("{","")
                        text = text.replace("}","")
                        textArr = text.split(':')
                        if len(textArr) > 1:
                            text = textArr[1]
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)
                
                elif mode =='gag-ko':
                    client = create_client("155.230.24.108", 40008)
                    result = client.send({'sentence': text, 'act':1})

                    chat_room = ChatRoom.objects.get(id=room_id)
                    if result is None or str(result) == '':
                        text = 'error'
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)
                    else :
                        text = str(result)
                        text = text.replace("{","")
                        text = text.replace("}","")
                        textArr = text.split(':')
                        if len(textArr) > 1:
                            text = textArr[1]
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)

                elif mode =='scenario-ko':
                    client = create_client("155.230.24.108", 40997)
                    result = client.send({'query': text })

                    chat_room = ChatRoom.objects.get(id=room_id)
                    if result is None or str(result) == '':
                        text = 'error'
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)
                    else :
                        text = str(result)
                        text = text.replace("{","")
                        text = text.replace("}","")
                        textArr = text.split(':')
                        if len(textArr) > 1:
                            text = textArr[1]
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)

                elif mode =='silver-ko':
                    client = create_client("155.230.24.108", 40003)
                    result = client.send({'sentence': text })

                    chat_room = ChatRoom.objects.get(id=room_id)
                    if result is None or str(result) == '':
                        text = 'error'
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)
                    else :
                        text = str(result)
                        text = text.replace("{","")
                        text = text.replace("}","")
                        textArr = text.split(':')
                        if len(textArr) > 1:
                            text = textArr[1]
                        message = Message.objects.create(author=username, chat_room=chat_room, content=text)
                
                else :
                    chat_room = ChatRoom.objects.get(id=room_id)
                    text = 'other I am sorry !'
                    message = Message.objects.create(author=username, chat_room=chat_room, content=text)

                content['cesType'] = '1'
                content['message'] = self.message_to_json(message)            
                cache.set("room_cm:" + room_id, (username, message.id))
                self.send_chat_message(content, room_id)
                                        
            except Exception:
                chat_room = ChatRoom.objects.get(id=room_id)
                text = 'I am sorry !'
                message = Message.objects.create(author=username, chat_room=chat_room, content=text)
                content['cesType'] = '1'
                content['message'] = self.message_to_json(message)
                self.send_chat_message(content, room_id) 
                        
        except ChatUser.DoesNotExist:
            content['result'] = 'Fail ceslea message.(chat user)'
            self.send_message(content)
        except ChatRoom.DoesNotExist:
            content['result'] = 'Fail ceslea message. (chat room)'
            self.send_message(content)
        except User.DoesNotExist:
            content['result'] = 'Fail ceslea message. (user)'
            self.send_message(content)
        except KeyError:
            content['result'] = 'Fail ceslea message. (key error)'
            self.send_message(content)

    def message_to_json(self, message):
        content = {
            'id': str(message.id),
            'type': message.type,
            'author': message.author,
            'content': message.content,
            'created_at': str(message.created_at.strftime("%H:%M")) # "%Y-%m-%d %H:%M:%S"
        }

        author = message.author
        if author != "system":
            user_obj = User.objects.get(username=author)
            user_thumbnail_url = str(user_obj.user_thumbnail)
            if user_thumbnail_url:
                content['profile_image'] = settings.SERVER_MEDIA_URL + user_thumbnail_url
            else:
                content['profile_image'] = settings.DEFULT_USER_THUMBNAIL_URL

        return content

    commands = {
        'init_chat': init_chat,
        'fetch_messages': fetch_messages,
        'new_message': new_message,
        'ceslea_message': ceslea_message,
        'intent_message': intent_message,
        'file_message' : file_message,
    }

    def connect(self):
        self.scope["session"].save()
        self.accept()

    def disconnect(self, close_code):
        try:
            room_id = self.scope['room_id']
            username = self.scope['user']

            # celery tasks
            set_last_message_read.delay(username, room_id)

            # leave group room
            async_to_sync(self.channel_layer.group_discard)(
                room_id,
                self.channel_name
            )

        except ValueError:
            logger.error("i don't no. >>", self.scope['user'])
        except KeyError:
            logger.error("why didn't call init chat?")

    def receive(self, text_data):
        data = json.loads(text_data)
        self.commands[data['command']](self, data)

    def send_message(self, message):
        self.send(text_data=json.dumps(message))

    def send_chat_message(self, message, room_id):
        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            room_id,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    # Receive message from room group
    def chat_message(self, event):
        message = event['message']
        # Send message to WebSocket
        self.send(text_data=json.dumps(message))