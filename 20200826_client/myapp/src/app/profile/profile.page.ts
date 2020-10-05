import { Component, OnInit, Input} from '@angular/core';
import { NavController, Platform, AlertController, ModalController, LoadingController} from '@ionic/angular';
import { Router } from  "@angular/router";
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { CameraPage } from '../modal/camera.page'
import { UserInfo } from '../../providers/globalvars/globalvars';
import { ServerProvider } from '../../providers/server/server';
import { FileTransfer} from '@ionic-native/file-transfer/ngx';
import { File, FileEntry } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  
  user: any;
  id:any;
  name:any;
  statusStr: string= "";
  imageData: string = null;
  serverIp: string = "";
  lastImage: string = null;
  participants: any;
  images = [];
  filename: string= "";

  uploadimg : Boolean = false;

  @Input() useURI = true;

  constructor(public  router:  Router, public navCtrl: NavController, private platform: Platform,
    private alertCtrl: AlertController, private camera: Camera, public modalController: ModalController,
    private serverProvider: ServerProvider, private userInfo: UserInfo, private transfer: FileTransfer,
    private file: File, private filePath: FilePath, private loadingController: LoadingController, 
    public http: HttpClient) { 
    

    this.id = this.platform.getQueryParam("id");
    this.name = this.platform.getQueryParam("name");
    this.serverIp = this.serverProvider.serverIp;  
    
    this.serverProvider.requestRoomList();       

    this.uploadimg = false;
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
    //ionicHistory.clearCache();
    this.user = this.userInfo.getUserInfo();

    if(this.user.status != '')
      this.statusStr = this.user.status;
    else
      this.statusStr = "Hello!!";

    this.filename = this.readFileName(this.user.userId);
    console.log('ionViewDidEnter profile : ' + this.user.profile); 
    this.imageData = encodeURI(this.user.profile); 
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter ProfilePage'); 
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave ProfilePage');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave ProfilePage');   
    if(this.uploadimg)
      window.location.reload();     
  }

  ionViewDidLeave() {    
    console.log('ionViewDidLeave ProfilePage');
    console.log('============================================');    
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload ProfilePage');        
  }

  changeProfileStatus(){
    console.log('changeProfileStatus ProfilePage');   
    this.addStatusAlert();
  }

  async addStatusAlert() {  

    const alert = await this.alertCtrl.create({
    header : '상태메시지 입력',
    inputs: [{
        name: 'status',
        placeholder: '',
        value: this.statusStr
    }],
    buttons: [{
       text: '취소',
       role: 'cancel',
       handler: () => {
         console.log('Cancel clicked');
       }
     },
     {
       text: '확인',
       handler: (data) => {
          console.log('OK clicked :' + data.status);
          if (data.status.trim() != '') {
            this.serverProvider.setProfile(data).then((res: any) => {
              if(res.result == "True") {  
                this.statusStr = data.status;
              } 
            })
          } 
          alert.dismiss();
          return false;
       }
     }
   ]
   });
   return await alert.present();  
 }

 setMeChat() {

    if(this.id == ''){
      return;
    }  

    //this.messageAlert("준비중","확인");
    let roomId = "";
    let roomList = [];
    roomList = this.userInfo.getRoomList();
    console.log(JSON.stringify(roomList));
    let data = JSON.stringify(roomList);
    for(var i=0; i<roomList.length; i++){
      var json = roomList[i];
      console.log('setMeChat room_id : ' + json['room_id']); 
      console.log('setMeChat participants : ' + json['participants'][0]); 

      if(this.userInfo.getUserId() == json['participants'][0]) {
        roomId = json['room_id'];
        break;
      }
    }

    this.participants = [];
    if(roomId != '') {
      this.participants.push(this.userInfo.getUserId());    
      this.serverProvider.requestRoomId(this.participants, roomId).then(res => {
        this.router.navigateByUrl('/room');
      });
    } else {
      this.serverProvider.requestRoomId(this.participants, 'me').then(res => {
        this.router.navigateByUrl('/room');
      });
    }
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
        let filename = this.createFileName(this.id);
        this.serverProvider.setPhotoDelete(filename).then((res: any) => {
          if(res.result == "True") {  
            this.imageData = "/assets/imgs/default.jpg";
            var profileUrl = 'http://' + this.serverIp + '/media/default_img/user.jpg';
            console.log('File delete complete : '+ profileUrl);
            this.userInfo.setProfile(profileUrl);
          } 

          this.uploadimg = true;
        })        
      } else if(data.data == '2'){
        this.getPicture(1);
      } else if(data.data == '3'){
        this.getPicture(2);
      }

    });
    return await modal.present();
  }

  setchatTest(data, lan) {
    console.log('setchatTest ==');
    this.serverProvider.setChatTest(data, lan).then((res: any) => {
      console.log('setchatTest res.result: ' + res.result);
    })
  }

  getPicture(srcType: number) {
    const options: CameraOptions = {
      quality: 30,
      allowEdit: true,
      saveToPhotoAlbum: false,
      correctOrientation: true,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      sourceType: srcType,
    };

    this.camera.getPicture(options).then(imagePath => {

      if (this.platform.is('android')) {
          this.filePath.resolveNativePath(imagePath)
              .then(filePath => {

                this.imageData = (window as any).Ionic.WebView.convertFileSrc(imagePath);
                
                let correctPath = filePath.substr(0, filePath.lastIndexOf('/') + 1);
                let currentName = '';
                let pathCheck  = imagePath;  
                if(pathCheck.lastIndexOf('?') != -1) {
                  currentName = imagePath.substring(imagePath.lastIndexOf('/') + 1, imagePath.lastIndexOf('?'));
                } else {
                  currentName = imagePath.substring(imagePath.lastIndexOf('/') + 1, imagePath.length);
                }
                
                this.copyFileToLocalDir(correctPath, currentName, this.createFileName(this.id));

              });
      } else {

          this.imageData = 'data:image/jpeg;base64,' + imagePath;
          var correctPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
          var currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);          
          console.log('currentName 11: ' + currentName);
          console.log('correctPath 11: ' + correctPath);
          this.copyFileToLocalDir(correctPath, currentName, this.createFileName(this.id));
      }
    }, (err) => {
      console.log(err);
    });
  }

  createFileName(filename) {
    // filename = filename.replace("@", "-");
    // filename = filename.replace(".", "-");
    // filename = filename.replace(".", "-");
    return filename +".jpg";
  }

  readFileName(id) {
    var fileName = id;
    // fileName = fileName.replace("@", "-");
    // fileName = fileName.replace(".", "-");
    // fileName = fileName.replace(".", "-");
    return fileName +".jpg";
  }

  copyFileToLocalDir(namePath, currentName, newFileName) {
    this.file.copyFile(namePath, currentName, this.file.dataDirectory, newFileName).then(success => {
      this.lastImage = newFileName;
      let filePath = this.pathForImage(this.lastImage);
      console.log('copyFileToLocalDir success==');

      this.imageUpload(newFileName, filePath);
      
    }, error => {
      console.log('copyFileToLocalDir fail==');
    });
  }

  pathForImage(img) {
    if (img === null) {
      return '';
    } else {
      return this.file.dataDirectory + img;
    }
  }
  
  startUpload(filePath: any) {
    this.file.resolveLocalFilesystemUrl(filePath)
    .then(entry => {
      (<FileEntry> entry).file(file => this.readFile(file));
    }).catch(err => {
      console.log('startUpload fail==');
    });
  }

  readFile(file: any) {
    
    let reader = new FileReader();
    reader.onload = () => {
        const formData = new FormData();
        const imgBlob = new Blob([reader.result], {
            type: file.type
        });
        formData.append('file', imgBlob, file.name);
        var header = { "headers": {'Content-Type':'multipart/form-data;boundary=*****'} };
        this.http.post('http://' + this.serverIp + '/profile/photo/', formData, header)
        .subscribe((res: any)  => {
            console.log('readFile res==' + res.result);
            if(res.result == 'True') {
              console.log('File upload res.url : '+ res.url);
              var profileUrl = 'http://' + this.serverIp + '/' + res.url;
              console.log('File upload complete : '+ profileUrl);
              this.userInfo.setProfile(profileUrl);
              console.log('File upload complete.');
              this.ionViewWillEnter();
              //window.location.reload();
              this.uploadimg = true;
            } else {
              console.log('File upload failed.');
            }
        });

    };
    reader.readAsArrayBuffer(file);
  }

  async imageUpload(fileName, filePath) { 
    // File for Upload 
    var targetPath = filePath;       
    // File name only 
    var filename = fileName; 
    
    console.log('imageUpload targetPath == '+ targetPath);
    console.log('imageUpload filename == '+ filename);

    this.startUpload(targetPath);
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

  /*downloadFile() {
    let filename = this.createFileName(this.id);
    let url = 'http://' + this.serverIp + '/media/profile_img/' + filename;
    const fileTransfer: FileTransferObject = this.transfer.create();
    fileTransfer.download(url, filename).then((entry) => {
        console.log('fileTransfer.download data ** ** ** **:' + JSON.stringify(entry));
        this.imageData = entry.toUrl();
    }, (err) => {
      // handle error
      console.log("downloadfile() error: " + JSON.stringify(err));
    });
  }*/
   
}
