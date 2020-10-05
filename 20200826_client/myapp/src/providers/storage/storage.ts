import { Injectable } from '@angular/core';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import * as CryptoJs from 'crypto-js';

@Injectable()
export class StorageProvider {

  constructor(private nativeStorage: NativeStorage) {    
  }

  /* ServerIp Save */
  saveServerIp(serverIp) {   

    console.log('saveServerIp');     

    this.nativeStorage.setItem("serverIp", serverIp)
    .then(
      () => console.log('Save ServerIp'),
      error => console.error('Error storing item', error)
    );
  }

  /* Get ServerIp */
  getServerIp() {    
    return new Promise((resolve, reject) => {
      
      this.nativeStorage.getItem("serverIp").then(data => {        
        resolve(data);
      }, error => console.log(JSON.stringify(error)));
    });
  }

  /* Decrypt Method */
  decryptValue(value) {
    var key = value.substring(0, 16);
    var encrypt = value.substring(16, value.length);    
    var decrypted = CryptoJs.AES.decrypt(encrypt, key);

    return decrypted.toString(CryptoJs.enc.Utf8);
  }

  /* Encrypt Method */
  encryptValue(value) {
    var buffer = "";

    for (var i = 0; i < 16; i++) {
      buffer += Math.floor((Math.random() * 10));
    }
    
    var encrypted = CryptoJs.AES.encrypt(value, buffer);    

    return (buffer + encrypted);
  }

  /* Login Info Save */
  saveLoginInfo(userId, password) {
    return new Promise((resolve, reject) => {
      let userIdenc = this.encryptValue(userId);
      let passwordenc = this.encryptValue(password);

      let userIdP = new Promise((resolveu, rejectu) => {
        this.nativeStorage.setItem("userId", userIdenc).then(
          data => {
            resolveu()
          },
          error => rejectu(error)
        );
      });

      let passwordP = new Promise((resolvep, rejectp) => {
        this.nativeStorage.setItem("password", passwordenc).then(
          data => {
            resolvep()
          },
          error => rejectp(error)
        );
      });

      Promise.all([userIdP, passwordP]).then(() => {
        console.log('Login Info Save Success');
        resolve();
      }, (err) => {       
        reject(err);
      });
    });
  }

  /* Get Login Info */
  getLoginInfo() {
    return new Promise((resolve, reject) => {
      let userId, password;

      let userIdP = new Promise((resolveu, rejectu) => {
        this.nativeStorage.getItem("userId")
          .then(
            data => {
              userId = data;
              resolveu(data)
            },
            error => rejectu(error)
         );
      });
      let passwordP = new Promise((resolvep, rejectp) => {
        this.nativeStorage.getItem("password")
          .then(
            data => {
              password = data;
              resolvep(data)
            },
          error => rejectp(error)
         );
      });

      Promise.all([userIdP, passwordP]).then(() => {
        userId = this.decryptValue(userId);
        password = this.decryptValue(password);
        
        resolve({ userId: userId, password: password });
      }, (err) => {
        reject(err);
      });
    });
  }
}
