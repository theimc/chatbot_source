import { Component } from '@angular/core';
import { NavController, AlertController, Events } from '@ionic/angular';
import { Router } from  "@angular/router";
import { ServerProvider } from '../../providers/server/server';
import { DatabaseProvider } from '../../providers/database/database';
import { UserInfo } from '../../providers/globalvars/globalvars';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  
  roomList: any;

  constructor(private  router:  Router,public navCtrl: NavController, private serverProvider: ServerProvider, 
    private alertCtrl: AlertController, private events: Events,
    private databaseProvider: DatabaseProvider, public userInfo: UserInfo) {
    
    this.events.subscribe('room:close', () => {      
      this.requestRoomList();
    });

  }

  /* Page Life Cycle */
  ionViewCanEnter() {
    console.log('ionViewCanEnter RoomListPage');        
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RoomListPage');    
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter RoomListPage');
    //this.requestRoomList();   
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter RoomListPage');            
    this.requestRoomList();   
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave RoomListPage');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave RoomListPage');        
  }

  ionViewDidLeave() {
    console.log('ionViewDidLeave RoomListPage');
    console.log('============================================');
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload RoomListPage');        
  }

  /* Get RoomList */
  requestRoomList() {    
     this.serverProvider.requestRoomList();           
  }

  /* Join Room */
  joinRoom(item) {   
        
     this.serverProvider.requestRoomId(item.participants, item.room_id).then(res => {
      //this.app.getRootNavs()[0].push(RoomPage);
      this.router.navigateByUrl('/room');
    });
  }

  /* Exit Room */
  exitRoom(slidingItem, item) {
    slidingItem.close();
    this.exitRoomAlert(item);
  }

  async exitRoomAlert(item) {  
     const alert = await this.alertCtrl.create({
     header : item.room_name,
     message: 'Do you want to exit room?',
     buttons: [{
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      },
      {
        text: 'Exit',
        handler: () => {
            console.log('Exit clicked');
	          this.serverProvider.exitRoom(item.room_id).then(res => {            
              this.requestRoomList();
              this.databaseProvider.deleteRow(item.room_id);
              //this.navCtrl.setRoot(this.navCtrl.getActive().component);           
          })
        }
      }
    ]
    });
     return await alert.present();  
  }

}
