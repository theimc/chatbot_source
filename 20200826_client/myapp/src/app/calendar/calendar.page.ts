import { Component} from '@angular/core';
import { NavController, Platform, AlertController, ModalController, LoadingController} from '@ionic/angular';
import { Router } from  "@angular/router";
import { UserInfo } from '../../providers/globalvars/globalvars';
import { ServerProvider } from '../../providers/server/server';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage {
  
  roomId:any;
  date: string;
  type: 'string';
  
  options = {
    from: new Date(2000, 0, 1),
    canBackwardsSelected : true
  }

  constructor(public  router:  Router, public navCtrl: NavController, private platform: Platform,
    private alertCtrl: AlertController, public modalController: ModalController, 
    private serverProvider: ServerProvider, private userInfo: UserInfo, private loadingController: LoadingController) { 
    
    this.roomId = this.platform.getQueryParam("roomId");
    console.log('CalendarPage this.roomId: ' + this.roomId);

    // this.serverProvider.setChatSummary(this.roomId, 'test').then((res: any) => {
    //   console.log('setChatSummary res.result: ' + res.result);
    // })
  }

  ngOnInit() {
    
  }

  /* Page Life Cycle */
  ionViewCanEnter() {
    console.log('ionViewCanEnter ProfilePage');       
  }

  ionViewDidLoad() {    
    console.log('ionViewDidLoad ProfilePage');    
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter ProfilePage');
    console.log('ionViewCanEnter ProfilePage ngOnInit'); 
    
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter ProfilePage'); 
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave ProfilePage');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave ProfilePage');   
    
  }

  ionViewDidLeave() {    
    console.log('ionViewDidLeave ProfilePage');
    console.log('============================================');    
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload ProfilePage');        
  }

  onChange($event) {
    console.log($event);
  }

  // monthChangee($event) {
  //   console.log($event);
  // }

  
}
