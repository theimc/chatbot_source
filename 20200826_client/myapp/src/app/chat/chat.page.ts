import { Component, OnInit} from '@angular/core';
import { NavController, Platform, AlertController } from '@ionic/angular';
import { Router } from  "@angular/router";
import { ServerProvider } from '../../providers/server/server';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  
  id:any;
  name:any;
  status :any;
  profileimg : any;
  statusStr:string ="Hello!!";
  participants: any;

  constructor(public  router:  Router, public navCtrl: NavController, private platform: Platform, 
    private serverProvider: ServerProvider, private alertCtrl: AlertController) { 
  
    this.id = this.platform.getQueryParam("id");
    this.name = this.platform.getQueryParam("name");
    this.status = this.platform.getQueryParam("status");
    this.profileimg = this.platform.getQueryParam("img");
    console.log('constructor this.id : ' + this.id);
    console.log('constructor this.name : ' + this.name);
    console.log('constructor this.status : ' + this.status);
    console.log('constructor this.profileimg : ' + this.profileimg);

    if(this.status != '')
      this.statusStr = this.status;
  }

  ngOnInit() {
	
  }

  /* Page Life Cycle */
  ionViewCanEnter() {
    console.log('ionViewCanEnter ChatPage');       
  }

  ionViewDidLoad() {    
    console.log('ionViewDidLoad ChatPage');    
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter ChatPage');
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter ChatPage'); 
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave ChatPage');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave ChatPage');        
  }

  ionViewDidLeave() {    
    console.log('ionViewDidLeave ChatPage');
    console.log('============================================');    
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload ChatPage');        
  }

  startChat(){
    if(this.id == ''){
      return;
    }

    this.participants = [];
    this.participants.push(this.id);
    
    this.serverProvider.requestRoomId(this.participants, null).then(res => {
      //this.navCtrl.getRootNavs()[0].push(RoomPage);
      this.router.navigateByUrl('/room');
    });
  }

  async addStatusAlert() {  
    const alert = await this.alertCtrl.create({
    header : 'Input Status',
    inputs: [{
        name: 'status',
        placeholder: 'Status'
    }],
    buttons: [{
       text: 'Cancel',
       role: 'cancel',
       handler: () => {
         console.log('Cancel clicked');
       }
     },
     {
       text: 'OK',
       handler: (data) => {
          console.log('Add clicked');

          this.id = data.status;

          alert.dismiss();
          return false;
       }
     }
   ]
   });
   return await alert.present();  
 }

}
