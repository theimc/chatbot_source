import { Component } from '@angular/core';
import { NavController, AlertController, LoadingController} from '@ionic/angular';
import { ServerProvider } from '../../providers/server/server';
import { DatabaseProvider } from '../../providers/database/database';
import { StorageProvider } from '../../providers/storage/storage';
import { UserInfo } from '../../providers/globalvars/globalvars';
import { Router } from  "@angular/router";
import { NativePageTransitions, NativeTransitionOptions } from '@ionic-native/native-page-transitions/ngx';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  loading:any;

  user: any;

  constructor(private  router:  Router, public navCtrl: NavController,private serverProvider: ServerProvider,
    private databaseProvider: DatabaseProvider, private storageProvider: StorageProvider, private alertCtrl: AlertController,
    private userInfo: UserInfo, private nativePageTransitions: NativePageTransitions, private loadingCtrl: LoadingController) {

      this.user = this.userInfo.getUserInfo();
      
    }

   /* Page Life Cycle */
  ionViewCanEnter() {
    console.log('ionViewCanEnter OptionPage'); 
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad OptionPage');    
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter OptionPage');    
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter OptionPage');            
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave OptionPage');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave OptionPage');        
  }

  ionViewDidLeave() {
    console.log('ionViewDidLeave OptionPage'); 
    console.log('============================================');
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload OptionPage');        
  }
  
  /* Logout */
  logout() {
    console.log('logout');    

    this.showLoading("please wait...");
    this.serverProvider.logout().then(
      (res: any) => {      
      if(res.result == "True") {
        this.databaseProvider.dropTable();
        this.storageProvider.saveLoginInfo("", "");        
        this.userInfo.initialize();

        let options: NativeTransitionOptions = {          
          duration: 600
        };
 
        this.loaderDismiss();
        this.nativePageTransitions.flip(options);
        this.navCtrl.navigateRoot('/login');
      } else {
        this.loaderDismiss();
      }
    }, (err) => {
      this.loaderDismiss();
    });    
  }

  setProfile(item) {
    console.log("setProfile item.userId == : " + item.userId);  
    this.router.navigateByUrl('/profile?id=' + item.userId + "&name=" + item.userName);
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

  async logoutAlert() {  
    const alert = await this.alertCtrl.create({
    message: "Do you want logout?",
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
         console.log('OK clicked');
         this.logout();
         this.alertCtrl.dismiss();
         return false;
       }
     }
   ]
   });
   return await alert.present();  
  }

}
