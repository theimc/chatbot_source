import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { NavController, IonSlides, AlertController, LoadingController, Platform, ModalController } from '@ionic/angular';
import { Router } from  "@angular/router";
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NativePageTransitions, NativeTransitionOptions } from '@ionic-native/native-page-transitions/ngx';
import { ServerProvider } from '../../../providers/server/server';
import { StorageProvider } from '../../../providers/storage/storage';
import { Dialogs } from '@ionic-native/dialogs/ngx';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { CameraPage } from '../../modal/camera.page';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
// import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook/ngx';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  @ViewChild(IonSlides, { static: false })  slides: IonSlides;
  @Input() useURI = true;

  loading:any;
  imageData: string = "/assets/imgs/default.jpg";

  /* Form Group */
  serverForm: FormGroup;
  loginForm: FormGroup;
  registerForm: FormGroup;

  /* Server Ip */
  serverIp: string = "";

  /* Login Info */
  loginUserId: string = "";
  loginPassword: string = "";
  loginAttempt: Number = 0;

  /* Register Info */  
  registerUserId: string = "";
  registerUserName: string = "";
  registerPassword: string = "";
  registerPasswordConf: string = "";  
  registerAttempt: Number;

  tempstr : string ="";
  tempstr1 : any;

  isLoggedIn = false;
  // users = { id: '', name: '', email: '', picture: { data: { url: '' } } };

  constructor(private  router:  Router, public navCtrl: NavController,
	private formBuilder: FormBuilder, private nativePageTransitions: NativePageTransitions, private alertCtrl: AlertController,
	private serverProvider: ServerProvider, private storageProvider: StorageProvider,
	private loadingCtrl: LoadingController, public reactiveFormsModule: ReactiveFormsModule, 
  private platform: Platform, private dialogs: Dialogs,
  private camera: Camera, public modalController: ModalController,
  private googlePlus: GooglePlus) {//, private fb: Facebook) { 
  
    console.log('constructor LoginPage');

    /* Server Setting Form */
    this.serverForm = this.formBuilder.group({      
      ServerIp: ['', Validators.compose([Validators.maxLength(30)])]
    });

    /* Login Form */
    this.loginForm = this.formBuilder.group({
      UserId: ['', Validators.compose([Validators.maxLength(70), Validators.pattern('^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{3,})$'), Validators.required])],
      Password: ['', Validators.compose([Validators.maxLength(30)])],      
    });

    //[A-Za-z0-9._%+-]{2,}@[a-zA-Z-_.]{2,}[.]{1}[a-zA-Z]{2,}
    /* Register Form */
    this.registerForm = this.formBuilder.group({
      UserId: ['', Validators.compose([Validators.maxLength(70), Validators.pattern('^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{3,})$'), Validators.required])],
      UserName: ['', Validators.compose([Validators.maxLength(30)])],
      Password: ['', Validators.compose([Validators.maxLength(30)])],
      PasswordConf: ['', Validators.compose([Validators.maxLength(30)])],
    });

    this.platform.ready().then(() => {
      console.log('Platform Ready LoginPage');      
      
      console.log("Server Ip == : " + this.serverProvider.serverIp);  
      this.serverIp = this.serverProvider.serverIp;      
         
    });

  }

  ngOnInit() {
	
  }

  /* Page Life Cycle */
  ionViewCanEnter() {
    console.log('ionViewCanEnter LoginPage');       
  }

  ionViewDidLoad() {    
    console.log('ionViewDidLoad LoginPage');    
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter LoginPage');    
    this.slides.slideTo(1, 0);
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter LoginPage');    
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave LoginPage');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave LoginPage');        
  }

  ionViewDidLeave() {    
    console.log('ionViewDidLeave LoginPage');
    console.log('============================================');    
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload LoginPage');        
  }

  saveServerIp() {
	
    if (this.serverIp == "") {  
	    this.messageAlert('Please input server ip', 'OK');
    } else {
	    console.log("Server Ip : " + JSON.stringify(this.serverIp));     
	    this.storageProvider.saveServerIp(this.serverIp);
	    this.serverIPSaveAlert();
    }
  }

  async login(){
    
      if(this.serverIp == ""){
        this.messageAlert('Please save ip.', 'OK');
        return;
      }

      if (this.loginUserId == "") {      
        this.loginAttempt = 1;
        this.messageAlert('Please input Email.', 'OK');
        return;
      } 

      var elementValue = this.loginUserId;
      if(elementValue){
        var regex = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/;   
        if (!regex.test(elementValue)) {
            this.messageAlert('Email is invalid.', 'OK');
            return;
        }
      }
      
      if(this.loginPassword == "") {
        this.loginAttempt = 2;
        this.messageAlert('Please input password.', 'OK');  
        return;    
      } 
            
      const loading = await this.loadingCtrl.create({
        message: 'Please wait...'
      });
      this.presentLoading(loading);

      this.serverProvider.login(this.loginUserId, this.loginPassword)
      .then((res: any) => {
        if (res.result == "True") {        
          let options: NativeTransitionOptions = {          
          duration: 600
          };

          console.log('res.profile_imgae : ' + res.profile_image);     
          console.log('res.status_message : ' + res.status_message);  
          console.log('res.name : ' + res.name);  

          loading.dismiss();
        
          this.nativePageTransitions.flip(options);
          this.navCtrl.navigateRoot('/app/tabs/tab1');
        } else {
          loading.dismiss();
          this.loginAttempt = 3;
          this.messageAlert('Please check id and password', 'OK');
        }
      }, (err) => {
        loading.dismiss();
        this.loginAttempt = 3;
        console.log("post-err:" + JSON.stringify(err));   
        this.messageAlert('Please check id and password', 'OK');
      });	 
      
  }

  googleLogin() {
    //this.messageAlert('준비중입니다..', 'OK');
    this.doGoogleLogin();
  }

  async doGoogleLogin(){
    const loading = await this.loadingCtrl.create({
      message: 'Please wait...'
    });
    this.presentLoading(loading);
  
    //647320813926-7scjkjujfbsscn84vg6tpqbnc0l3kp3e.apps.googleusercontent.com
    this.googlePlus.login({
      scopes : '', // optional, space-separated list of scopes, If not included or empty, defaults to `profile` and `email`.
      webClientId : '647320813926-7scjkjujfbsscn84vg6tpqbnc0l3kp3e.apps.googleusercontent.com', // optional clientId of your Web application from Credentials settings of your project - On Android, this MUST be included to get an idToken. On iOS, it is not required.
      offline : true // Optional, but requires the webClientId - if set to true the plugin will also return a serverAuthCode, which can be used to grant offline access to a non-Google server
    })
    .then(user =>{
      loading.dismiss();
  
      console.log(JSON.stringify(user));
      console.log('user.displayName ' + user.displayName);
      console.log('user.email ' + user.email);
      console.log('user.imageUrl ' + user.imageUrl);
      // this.nativeStorage.setItem('google_user', {
      //   name: user.displayName,
      //   email: user.email,
      //   picture: user.imageUrl
      // })
      // .then(() =>{
      //   this.router.navigate(["/user"]);
      // }, error =>{
      //   console.log(error);
      // })
      // loading.dismiss();
    }, err =>{
      console.log("google login err")
      console.log(err)
      console.log('error del metodo login => '+ JSON.stringify(err) );
      loading.dismiss();
    });
  }

  doGoogleLogout(){
    this.googlePlus.logout()
    .then(res =>{
      //user logged out so we will remove him from the NativeStorage
    
    }, err =>{
      console.log(err);
    })
  }

  async presentLoading(loading) {
    return await loading.present();
  }

  facebookLogin() {
    this.messageAlert('준비중입니다..', 'OK');
    // this.fbLogin();
  }

  // async fbLogin() {

  //   const loading = await this.loadingCtrl.create({
  //     message: 'Please wait...'
  //   });
  //   this.presentLoading(loading);

  //   this.fb.login(['public_profile', 'email'])
  //     .then(res => {
  //       if (res.status === 'connected') {
  //         loading.dismiss();
  //         this.isLoggedIn = true;
  //         this.getUserDetail(res.authResponse.userID);
  //       } else {
  //         this.isLoggedIn = false;
  //         loading.dismiss();
  //       }
  //     })
  //     .catch(e => {
  //       loading.dismiss();
  //       console.log('Error logging into Facebook', e)
  //     });
  // }

  // getUserDetail(userid: any) {
  //   this.fb.api('/' + userid + '/?fields=id,email,name,picture', ['public_profile'])
  //     .then(res => {
  //       console.log(res);
  //       // this.users = res;
  //     })
  //     .catch(e => {
  //       console.log(e);
  //     });
  // }

  // fbLogout() {
  //   this.fb.logout()
  //     .then( res => this.isLoggedIn = false)
  //     .catch(e => console.log('Error logout from Facebook', e));
  // }

  register() {
  
    if(this.serverIp == ""){
      this.messageAlert('Please save ip.', 'OK');
      return;
    }

    if (this.registerUserId == "") {      
      // Id Blank(Attempt: 0)
      this.registerAttempt = 0;
      this.messageAlert('Please Input E-mail.', 'OK');
      return;
    } 

    var elementValue = this.registerUserId;
    if(elementValue){
      var regex = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/;   
       if (!regex.test(elementValue)) {
          this.messageAlert('Email is invalid.', 'OK');
          return;
       }
    }
    
    if (this.registerUserName == "") {      
      // user Name Blank(Attempt: 1)
      this.registerAttempt = 1;
      this.messageAlert('Please Input User Name.', 'OK');
      return;

    } 
    
    if(this.registerPassword == "") {
      // Password Blank(Attempt: 2)
      this.registerAttempt = 2;
      this.messageAlert('Please Input password.', 'OK');
      return;

    } 
    
    if (this.registerPassword != this.registerPasswordConf) {
      // Password Mismatch(Attempt: 3)
      this.registerAttempt = 3;
      this.messageAlert('Please Input re-password.', 'OK');
      return;
    } 
    
    

    this.serverProvider.register(this.registerUserId, this.registerPassword, this.registerUserName)
    .then((res:any) => {
      if(res.result == "True") {

        this.messageRegisterAlert('You have successfully registered.', 'OK');

        /*this.loginUserId = this.registerUserId;
        this.loginPassword = this.registerPassword;

        this.registerUserId = "";
        this.registerPassword = "";
        this.registerPasswordConf = "";
        this.slides.slideTo(1, 500);*/
      } else {
        this.registerAttempt = 4;
        this.messageAlert('Membership failed.', 'OK');
      }
    }, (err) => {
        this.registerAttempt = 4;
        this.messageAlert('Membership failed.', 'OK');
    });
    
  }
 
  async serverIPSaveAlert() {
  
    if(this.serverIp == ""){
      this.messageAlert('Please save ip.', 'OK');
      return;
    }

    const alert = await this.alertCtrl.create({
      header : 'Save Success',
      message: "Server Ip : " + JSON.stringify(this.serverIp),
      buttons:  [{
        text: 'OK',
        handler: () => {
        this.loadingCtrl.create({
        message: 'please wait',
        duration: 3000
      }).then((res) => {
        res.present();
        res.onDidDismiss().then((dis) => {
        console.log('Loading dismissed! after 2 Seconds');
        location.reload();
        });
      });
      }
      }]
    });
    return await alert.present();  
  }

  async messageRegisterAlert(message, btn) {  
    const alert = await this.alertCtrl.create({
         header : '',
         message: message,
         buttons:  [{
           text: btn,
           handler: () => {
            this.loginUserId = this.registerUserId;
            this.loginPassword = this.registerPassword;

            this.registerUserId = "";
            this.registerPassword = "";
            this.registerPasswordConf = "";
            this.slides.slideTo(1, 500);
         }
       }]
    });
    return await alert.present();  
 }

  async messageAlert(message, btn) {  
     const alert = await this.alertCtrl.create({
          header : '',
	        message: message,
	        buttons:  [{
            text: btn,
            handler: () => {
          
          }
        }]
     });
     return await alert.present();  
  }

  async showPhotoModal() {
    const modal = await this.modalController.create({
      component: CameraPage,
      cssClass: 'signInModal'//,
      //componentProps: { value: 123 }
    });
  
    modal.onDidDismiss()
    .then((data) => {
        console.log("onDidDismiss: " + data.data);
        if(data.data == '1'){
          this.imageData = "/assets/imgs/test1.jpg";
        } else if(data.data == '2'){
          this.getPicture(1);
        } else if(data.data == '2'){
          this.getPicture(2);
        }
  
      });
      return await modal.present();
    }
  
   selectPhotoType(){
     
   }
  
   getPicture(srcType: number) {
      const options: CameraOptions = {
        quality: 100,
        destinationType: this.useURI ? this.camera.DestinationType.FILE_URI : this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        sourceType: srcType,
      };
  
      this.camera.getPicture(options).then((imageData) => {
        // imageData is either a base64 encoded string or a file URI
        if (this.useURI) {
          // const temp = imageData.split('?');
          // this.imageData = temp[0];
          this.imageData = (window as any).Ionic.WebView.convertFileSrc(imageData);
        } else {
          this.imageData = 'data:image/jpeg;base64,' + imageData;
        }
      }, (err) => {
        console.log(err);
      });
    }
}
