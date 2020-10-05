import { Injectable } from '@angular/core';

@Injectable()
export class GlobalvarsProvider {
  badgeCount = "";

  constructor() {
    this.badgeCount = "";
  }

  getBadgeCount() {
    return this.badgeCount;
  }

  setBadgeCount(badgeCount) {
    this.badgeCount = badgeCount;
  }
}

@Injectable()
export class UserInfo {
  userId: String;
  userName: String;
  profile: String;
  status:String;
  token: String;
  login: Boolean;
  roomList = [];
  
  constructor() {
    this.userId = "";
    this.userName = "";
    this.profile = "";
    this.status = "";
    this.token = "";
    this.login = false;
    this.roomList = [];
  }

  initialize() {
    this.userId = "";
    this.userName = "";
    this.profile = "";
    this.status = "";
    this.token = "";
    this.login = false;
    this.roomList = [];
  }

  setUserInfo(userId, userName, profile, status, login) {
    this.userId = userId;
    this.userName = userName;
    this.profile = profile;
    this.status = status;
    this.login = login
  }

  getUserInfo() {
    return {
      userId: this.userId,
      userName: this.userName,
      profile: this.profile,
      status: this.status,
      token: this.token
    };
  }

  setUserId(userId) {
    this.userId = userId;
  }

  getUserId() {
    return this.userId;
  }

  setUserName(userName) {
    this.userName = userName;
  }

  getUserName() {
    return this.userName;
  }

  setToken(token) {    
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  setProfile(profile) {
    this.profile = profile;
  }

  getProfile() {
    return this.profile;
  }

  setStatus(status) {
    this.status = status;
  }

  getStatus(){
    return this.status;
  }

  setLogin(login) {
    this.login = login;
  }

  getLogin() {
    return this.login;
  }

  setRoomList(roomList) {
    this.roomList = roomList;
  }

  getRoomList() {
    return this.roomList;
  }
}

@Injectable()
export class RoomInfo {
  roomId: String;
  roomName: any;
  participants: any;
  mode: String;
  category: string;
  lan:string;
  ttsOption: Number;
  lastMsgId: String;  

  constructor() {
    this.roomId = "";
    this.roomName = "";
    this.participants = null;
    this.mode = "MAX";
    this.category = "chitchat-en";
    this.lan = "en-US"
    this.ttsOption = 0;
    this.lastMsgId = "0";    
  }

  initialize() {
    this.roomId = "";
    this.roomName = "";
    this.participants = null;
    this.mode = "MAX";
    this.category = "chitchat-en";
    this.lan = "en-US"
    this.ttsOption = 0;
    this.lastMsgId = "0";    
  }

  setRoomInfo(rooId, roomName, participants, mode, category, lan) {
    this.roomId = rooId;
    this.roomName = roomName;
    this.participants = participants;
    this.mode = mode;
    this.category = category;
    this.lan = lan;
  }

  getRoomInfo() {
    return {
      roomId: this.roomId,
      roomName: this.roomName,
      participants: this.participants,
      mode: this.mode,
      category:this.category,
      lan: this.lan,
      ttsOption: this.ttsOption,
      lastMsgId: this.lastMsgId
      
    };
  }

  setRoomId(roomId) {
    this.roomId = roomId;
  }

  getRoomId() {
    return this.roomId;
  }

  setRoomName(roomName) {
    this.roomName = roomName;
  }

  getRoomName() {
    return this.roomName;
  }

  setParticipants(participants) {
    this.participants = participants;
  }

  getParticipants() {
    return this.participants;
  }

  setTTSOption(ttsOption) {
    this.ttsOption = ttsOption;
  }

  getTTSOption() {
    return this.ttsOption;
  }

  setMode(mode) {
    this.mode = mode;
  }

  getMode() {
    return this.mode;
  }

  setCategory(category){
    this.category = category;
  }

  getCategory() {
    return this.category;
  }

  setLan(lan) {
    this.lan = lan;
  }

  getLan() {
    return this.lan;
  }

  setLastMsgId(lastMsgId) {
    this.lastMsgId = lastMsgId;
  }

  getLastMsgId() {
    return this.lastMsgId;
  }
}