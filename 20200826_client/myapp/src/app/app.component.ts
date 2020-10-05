import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, MenuController, AlertController, Platform, LoadingController } from '@ionic/angular';
import { Router } from  "@angular/router";
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { RoomInfo, UserInfo, GlobalvarsProvider } from '../providers/globalvars/globalvars';
import { ServerProvider } from '../providers/server/server';
import { DatabaseProvider } from '../providers/database/database';
import { FcmProvider } from '../providers/fcm/fcm';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';
import { StorageProvider } from '../providers/storage/storage';
import { SpeechRecognition } from '@ionic-native/speech-recognition/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {

  count: any = 0;
  rootPage:any;
  loading:any;

  /* Menu */
  participants = [];
  menuOpen = false;
  selectOptions: any;
  ttsOption = 0;

  constructor(private  router:  Router,
    public navCtrl: NavController, private platform: Platform,
    private splashScreen: SplashScreen, private alertCtrl: AlertController,
    private statusBar: StatusBar, private menuCtrl: MenuController,
    public roomInfo: RoomInfo, public userInfo: UserInfo, 
    private serverProvider: ServerProvider, private databaseProvider: DatabaseProvider,
    private fcm: FcmProvider, private localNotifications: LocalNotifications, 
    private storageProvider: StorageProvider, private speechRecognition: SpeechRecognition,
    private globalvarsProvider: GlobalvarsProvider, private changeDetectorRef: ChangeDetectorRef,
    private loadingCtrl: LoadingController
  ) {
    
    this.initializeApp();

  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleLightContent();
      //this.splashScreen.hide();
     
      this.fcm.getToken().then(res => {
        this.userInfo.setToken(res);
      })
      
      /* Server Ip Setting */
      this.storageProvider.getServerIp().then((res: any) => {
        this.serverProvider.serverIp = res;        
	      console.log("serverIp ==== : " + JSON.stringify(this.serverProvider.serverIp));     
      });

      this.menuCtrl.enable(false, 'roomMenu');    

      this.fcm.listenToNotifications()
      .subscribe(data => {        
          // Background
          if(data.tab) {
            if(this.userInfo.getLogin()) {
              this.localNotifications.schedule({
                id: 1,
                title: data.userId,
                text: data.message,
                data : { secret: 'test' }
              });
            }
          }          
          // Foreground
          else {            
            if(data.userId != this.userInfo.getUserId() &&
              this.roomInfo.getRoomId() != data.roomId &&
              this.userInfo.getLogin() && data.userId != "system") {
              this.serverProvider.getBadgeCount();
              this.serverProvider.requestRoomList();
              setTimeout(() => {
                this.changeDetectorRef.detectChanges();
              }, 100)              
              this.localNotifications.schedule({
                id: 1,
                title: data.userId,
                text: data.message,
                data : { secret: 'test' }                
              });
            }
          }
      });    

      this.speechRecognition.requestPermission()
      .then((res: any) => {
        this.storageProvider.getLoginInfo().then((res: any) => {      
          this.serverProvider.login(res.userId, res.password).then((res) => {
            this.navCtrl.navigateRoot('/app/tabs/tab1');
          }, (err) => {
            console.log("login failure");
            this.navCtrl.navigateRoot('/login');
          });
        }, (err) => {
          console.log("no login info found");
          this.navCtrl.navigateRoot('/login');
        });
      }, (err) => {
        navigator['app'].exitApp();
      })
      
      this.selectOptions = {
        title: "CESLeA Message",
        mode: "ios"
      }
      
      this.splashScreen.hide();

      this.exitFromApp();
    });
  }

  exitFromApp() {

    this.platform.backButton.subscribe(() => {

      console.log("exitFromApp: " + this.router.url)
      if(this.router.url == '/app/tabs/tab1' || this.router.url == '/app/tabs/tab2' ||
      this.router.url == '/app/tabs/tab3' || this.router.url == '/login') {
        this.count++;
        if (this.count === 1) {        
          
        } else if (this.count === 2) {
          navigator['app'].exitApp();
          setTimeout(function () {
              this.count = 0;
          }, 800);
        }
      }      
    });
  }  

  async showLoading(data) {
    this.loading = await this.loadingCtrl.create({
        message: data,
        spinner: 'dots'
    });
    return await this.loading.present();
  }

  async loaderDismiss(){
    this.loading = await this.loadingCtrl.dismiss();
  }

  /* Room Menu Close */
  menuClosed() {
    console.log('menuClosed');
    this.menuOpen = false;          
  }

  /* Room Menu Open */
  menuOpened() {    
    console.log('menuOpened');
    this.menuOpen = true;
  }

  /* Menu_Invite */
  invitePage() {
    this.menuCtrl.close();
    this.router.navigateByUrl('/invite');
    //this.nav.push(InvitePage);
  }

  changeLanMode(event) {

    console.log('changeLanMode event : ' + event.target.value);
    this.roomInfo.setLan(event.target.value);

    this.menuCtrl.close();
  }

  /* Ceslea Mode Change */
  changeMode(event) {

    if(event.target.value != '') {
      console.log('changeMode event : ' + event.target.value);
      this.serverProvider.setCesleaMode(event.target.value);
    }

    this.menuCtrl.close();

    /*if(this.menuOpen) {
      this.serverProvider.setCesleaMode(event);
    }*/    
  }

  changeCategoryMode(event) {
    console.log('changeCategoryMode event : ' + event.target.value);
    if(event.target.value != '') {
      let categoryStr:string = "";
      if(event.target.value == 'chitchat-en') {
        this.roomInfo.setLan('en-US');
        categoryStr ="chitchat";
      } else if(event.target.value == 'scenario-en') {
        this.roomInfo.setLan('en-US');
        categoryStr ="scenario";
      } else if(event.target.value == 'travel-en') {
        this.roomInfo.setLan('en-US');
        categoryStr ="travel";
      } else if(event.target.value == 'chest-ko') {
        this.roomInfo.setLan('ko-KR');
        categoryStr ="chest";
      } else if(event.target.value == 'gag-ko') {
        this.roomInfo.setLan('ko-KR');
        categoryStr ="gag";
      } else if(event.target.value == 'scenario-ko') {
        this.roomInfo.setLan('ko-KR');
        categoryStr ="scenario";
      } else if(event.target.value == 'silver-ko') {
        this.roomInfo.setLan('ko-KR');
        categoryStr ="silver";
      }

      this.serverProvider.setCategoryMode(event.target.value, categoryStr);
    }

    this.menuCtrl.close();
  }

  /* TTS Option Change */
  changeTTS(event) {        
    if(this.menuOpen) {      
      this.databaseProvider.updateTTS(event.value? 1:0);
    }    
  }

  /* Exit Room */
  async exitRoom() {
    const alert = await this.alertCtrl.create({
     header : this.roomInfo.getRoomName(),
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
	        this.serverProvider.exitRoom(this.roomInfo.getRoomId()).then(res => {
            this.databaseProvider.deleteRow(this.roomInfo.getRoomId());
            this.menuCtrl.close();
            this.navCtrl.pop();
          });
        }
      }
    ]
    });
     return await alert.present();  
  }

}
