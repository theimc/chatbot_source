import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { StorageProvider } from '../storage/storage';
import { UserInfo, RoomInfo, GlobalvarsProvider } from '../globalvars/globalvars';
import { DatabaseProvider } from '../database/database';

@Injectable()
export class ServerProvider {
  /* Server Ip */
  serverIp = "";//"119.201.210.244:8080";

  headers = new HttpHeaders({ "content-type": "application/json" });
  constructor(public http: HttpClient, private storageProvider: StorageProvider,
    private userInfo: UserInfo, private roomInfo: RoomInfo,
    private databaseProvider: DatabaseProvider, private globalvarsProvider: GlobalvarsProvider) {
  }
  
  /* Register */
  register(userId, password, name) {
    let url = "/register/";
    let body = { 
      id: userId,
      pw: password,
      name: name
    };
    
    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  /* Login */
  login(userId, password) {    
    return new Promise((resolve, reject) => {
      let body = { id: userId, pw: password, token: this.userInfo.getToken() };

      this.http.post("http://" + this.serverIp + "/login/", JSON.stringify(body), 
      { headers: this.headers }).subscribe((res : any) => {
        if (res.result == "True") {
          this.databaseProvider.connection();          
          this.storageProvider.saveLoginInfo(userId, password);
          this.userInfo.setUserInfo(userId, res.is_name, res.profile_image, res.status_message, true);
          this.getBadgeCount();
          resolve(res);
        } else {
          reject("invalid userInfo");
        }
      }, (err) => {
        reject("network/server err");
      });         
    });
  }

  logout() {
    let body = { id: this.userInfo.getUserId() };    
    let url = "/logout/";

    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  setProfile(data) {
    //profile/set/
    let body = { id: this.userInfo.getUserId(), status_message: data.status};    
    let url = "/profile/set/";

    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        this.userInfo.setStatus(data.status);
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  setChatTest(data, language) {
    let body = { text: data, lan: language };    
    let url = "/profile/test/";

    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        console.log('setchatTest success ==');
        resolve(res);
      }, (err) => {
        console.log('setchatTest fail ==');
        reject(err);
      });
    });
  }

  setPhotoDelete(fileName) {
    let body = { id: this.userInfo.getUserId(), filename: fileName};
    let url = "/profile/photo/delete";

    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        //this.userInfo.setProfile("http://" + this.serverIp +"/media/default_img/user.jpg");
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });

  }

  /* Get Friend List */
  getFriendList() {
    let body = { id: this.userInfo.getUserId() };    
    let url = "/friend/getlist/";

    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  /* Delete Friend */
  deleteFriend(item) {
    let url = "/friend/delete/";
    let body = { id: this.userInfo.getUserId(), delete: item.id };

    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  /* Add Friend */
  addFriends(data) {
    let url = "/friend/add/";
    let body = { id: this.userInfo.getUserId(), add: data.friendId};

    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  addMeChat(data) {
    let url = "/me/add/";
    let body = { id: this.userInfo.getUserId(), add: data};

    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  /* Get RoomList */
  requestRoomList() {
    let url = "/chat/list/";
    let body = { username: this.userInfo.getUserId() };   

    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {        
        this.userInfo.setRoomList(res);
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  /* Get RoomId */
  requestRoomId(participants, roomId) {    
    let url = "/chat/join/";
    let body = { 
      my: this.userInfo.getUserId(), 
      participants: participants, 
      room_id: roomId 
    };
    
    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {        

        console.log('res.room_name == : ' + res.room_name);
        console.log('res.room_id == : ' + res.room_id);
        console.log('res.mode == : ' + res.mode);
        this.roomInfo.setRoomInfo(res.room_id, res.room_name, res.participants, res.mode, this.roomInfo.getCategory(), this.roomInfo.getLan());
        
        this.databaseProvider.getData().then((res: any) => {
          if(res.rows.length == 0) {
            this.databaseProvider.addData(this.roomInfo.getRoomId(), 0, "0");
          } else {
            this.roomInfo.setTTSOption(res.rows.item(0).ttsOption);
            this.roomInfo.setLastMsgId(res.rows.item(0).msgId);            
          }

          resolve(res);
        })                
      }, (err) => {
        reject(err);
      });
    });
  }

  /* Set Ceslea Mode */
  setCesleaMode(mode) {    
    let url = "/chat/mode/";
    let body = {
      mode: mode,
      room_id: this.roomInfo.getRoomId()
    };
    
    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {        
        this.roomInfo.setMode(mode);
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  /* set category mode */
  setCategoryMode(category, categoryStr) {
    let url = "/chat/category/";
    let body = {
      category: categoryStr,
      room_id: this.roomInfo.getRoomId()
    };
    
    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {       
        this.roomInfo.setCategory(category); 
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  /* set language mode */
  setLanguageMode(lan) {
    let url = "/chat/lan/";
    let body = {
      lan: lan,
      room_id: this.roomInfo.getRoomId()
    };
    
    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {        
        this.roomInfo.setLan(lan);
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  /* Invite */
  invite(inviteList) {
    let url = "/chat/invite/";
    let body = {
      my: this.userInfo.getUserId(),
      room_id: this.roomInfo.getRoomId(),
      participants: inviteList
    };
    
    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  /* Get Participant List */
  getParticipantList() {
    let url = "/chat/participants/";
    let body = { 
      username: this.userInfo.getUserId(),
      room_id: this.roomInfo.getRoomId()
    };

    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {        
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  /* Exit Room */
  exitRoom(roomId) {
    let url = "/chat/exit/";
    let body = {
      username: this.userInfo.getUserId(),
      room_id: roomId
    };
    
    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {       
        this.getBadgeCount();

        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  }

  /* Get RoomInfo */
  getRoomInfo() {
    let url = "/chat/info/";
    let body = {
      username: this.userInfo.getUserId(),
      room_id: this.roomInfo.getRoomId()
    };
    
    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        console.log('res.room_name == : ' + res.room_name);
        this.roomInfo.setRoomInfo(this.roomInfo.getRoomId(), res.room_name, res.participants, res.mode, this.roomInfo.getCategory(), this.roomInfo.getLan());
      }, (err) => {
        reject(err);
      });
    });
  }

  /* Get BadgeCount */
  getBadgeCount() {
    let url = "/chat/message/count/";
    let body = { username: this.userInfo.getUserId() };    
        
    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        if(res.result == "0") {
          this.globalvarsProvider.setBadgeCount("");
        } else {
          this.globalvarsProvider.setBadgeCount(res.result);
        }        
        resolve(res);
      }, (err) => {
        reject(err);
      });
    }); 
  }

  setBadgeCount(){

  }

  setChatSummary(roomId, data) {
    let body = { room_id: roomId, text:data };    
    let url = "/chat/summary/";

    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        console.log('setChatSummary success ==');
        resolve(res);
      }, (err) => {
        console.log('setChatSummary fail ==');
        reject(err);
      });
    });
  }

  getChatSummary(roomId, day) {
    let body = { room_id: roomId, day: day };    
    let url = "/chat/get/summary/";

    return new Promise((resolve, reject) => {
      this.http.post("http://" + this.serverIp + url, JSON.stringify(body),
      { headers: this.headers }).subscribe((res: any) => {
        console.log('getChatSummary success ==');
        resolve(res);
      }, (err) => {
        console.log('getChatSummary fail ==');
        reject(err);
      });
    });
  }

}