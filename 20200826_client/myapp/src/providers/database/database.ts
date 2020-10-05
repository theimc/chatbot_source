import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { RoomInfo } from '../globalvars/globalvars';

@Injectable()
export class DatabaseProvider {
  
  db: SQLiteObject;
  constructor(private sQLite: SQLite, private roomInfo: RoomInfo) {
  }

  connection() {
    return new Promise((resolve, reject) => {
      var sql = 'CREATE TABLE IF NOT EXISTS Info(roomId VARCHAR(16), ttsOption INT, msgId VARCHAR(50))';
     
      this.sQLite.create({
        name: 'data.db',
        location: 'default'
      }).then((db: SQLiteObject) => {
        this.db = db;
        this.db.executeSql(sql, [])
        .then((res) => resolve(res))
        .catch(e => reject(e));
      }).catch(e => reject(e));
    });
  }
  
  getData() { 
    return new Promise((resolve, reject) => {
      var roomId = this.roomInfo.getRoomId();
      var sql = "SELECT * FROM Info WHERE roomId = '"+ roomId + "'";

      this.db.executeSql(sql, [])
      .then(res => resolve(res))
      .catch(e => reject(e));
    });   
  }

  addData(roomId, ttsOption, msgId) {
    return new Promise((resolve, reject) => {
      var sql = "INSERT INTO Info (roomId, ttsOption, msgId) VALUES ('" +roomId+ "', '" +ttsOption+"', '" +msgId+"')";

      this.db.executeSql(sql, [])
      .then(res => {
        this.roomInfo.setTTSOption(ttsOption);
        this.roomInfo.setLastMsgId(msgId);
        resolve(res)
      })
      .catch(e => reject(e));    
    });
  }

  dropTable(): void {
    var sql = "DELETE FROM Info";

    this.db.executeSql(sql, [])
    .then((res) => {
      console.log(JSON.stringify(res));    
    })
    .catch(e => console.log(JSON.stringify(e)));
  }
  
  updateMsgId(msgId): void {
    var sql = "UPDATE Info SET msgId = '" +msgId+ "' WHERE roomId = '" + this.roomInfo.getRoomId() + "'";

    this.db.executeSql(sql, [])
    .then(() => this.roomInfo.setLastMsgId(msgId))
    .catch(e => console.log(JSON.stringify(e)));    
  }

  updateTTS(ttsOption): void {
    var sql = "UPDATE Info SET ttsOption = '" +ttsOption+ "' WHERE roomId = '" + this.roomInfo.getRoomId() + "'";

    this.db.executeSql(sql, [])
    .then(() => this.roomInfo.setTTSOption(ttsOption) )
    .catch(e => console.log(JSON.stringify(e)));    
  }

  deleteRow(roomId) {
    var sql = "DELETE FROM Info WHERE roomId = '" + roomId + "'";

    this.db.executeSql(sql, [])
    .then((res) => {
      console.log(JSON.stringify(res));    
    })
    .catch(e => console.log(JSON.stringify(e)));    
  }
}
