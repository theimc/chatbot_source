import json
import requests
import certifi

from chat_bot_server.settings import FIREBASE_KEY, FIREBASE_SENDER_ID


def user_notification(instance_id, title, message):
    url = 'https://fcm.googleapis.com/fcm/send'
    headers = {'Accept': 'application/json',
               'Content-Type': 'application/json',
               'Authorization': 'key=%s' % FIREBASE_KEY}
    body = {
        "to": instance_id,
        "notification": {
            "body": message, "title": title
        }
    }
    json_data = json.dumps(body)
    requests.post(url, data=json_data, headers=headers, verify=certifi.where())


def all_notification(title, message):
    url = 'https://fcm.googleapis.com/fcm/send'
    headers = {'Accept': 'application/json',
               'Content-Type': 'application/json',
               'Authorization': 'key=%s' % FIREBASE_KEY}
    body = {
        "to": "/topics/news",
        "notification": {
            "message": message, "title": title
        }
    }
    json_data = json.dumps(body)
    requests.post(url, data=json_data, headers=headers, verify=certifi.where())


def create_notification_group(room_id, registration_ids):
    url = 'https://fcm.googleapis.com/fcm/notification'
    headers = {'Accept': 'application/json',
               'Content-Type': 'application/json',
               'Authorization': 'key=%s' % FIREBASE_KEY,
               'project_id': FIREBASE_SENDER_ID}
    body = {
        "operation": "create",
        "notification_key_name": "%s" % room_id,
        "registration_ids": registration_ids
    }
    json_data = json.dumps(body)
    re = requests.post(url, data=json_data, headers=headers, verify=certifi.where())
    json_data = re.json()

    try:
        notification_key = json_data["notification_key"]
    except KeyError:
        notification_key = ''

    return notification_key


def add_notification_group(room_id, notification_key, registration_ids):
    url = 'https://fcm.googleapis.com/fcm/notification'
    headers = {'Accept': 'application/json',
               'Content-Type': 'application/json',
               'Authorization': 'key=%s' % FIREBASE_KEY,
               'project_id': FIREBASE_SENDER_ID}
    body = {
        "operation": "add",
        "notification_key_name": "%s" % room_id,
        "notification_key": "%s" % notification_key,
        "registration_ids": registration_ids
    }
    json_data = json.dumps(body)
    re = requests.post(url, data=json_data, headers=headers, verify=certifi.where())
    json_data = re.json()

    try:
        notification_key = json_data["notification_key"]
    except KeyError:
        notification_key = ''

    return notification_key


def remove_notification_group(room_id, notification_key, registration_ids):
    url = 'https://fcm.googleapis.com/fcm/notification'
    headers = {'Accept': 'application/json',
               'Content-Type': 'application/json',
               'Authorization': 'key=%s' % FIREBASE_KEY,
               'project_id': FIREBASE_SENDER_ID}
    body = {
        "operation": "remove",
        "notification_key_name": "%s" % room_id,
        "notification_key": "%s" % notification_key,
        "registration_ids": registration_ids
    }
    json_data = json.dumps(body)
    re = requests.post(url, data=json_data, headers=headers, verify=certifi.where())
    json_data = re.json()

    try:
        notification_key = json_data["notification_key"]
    except KeyError:
        notification_key = ''

    return notification_key


def group_notification(room_id, notification_key, user, message, participants=[]):
    url = 'https://fcm.googleapis.com/fcm/send'
    headers = {'Accept': 'application/json',
               'Content-Type': 'application/json',
               'Authorization': 'key=%s' % FIREBASE_KEY}
    body = {
        "to": notification_key,
        "data": {
            "roomId": room_id,
            "userId": user,
            "participants": participants,
            "message": message,
        }
    }
    json_data = json.dumps(body)
    re = requests.post(url, data=json_data, headers=headers, verify=certifi.where())