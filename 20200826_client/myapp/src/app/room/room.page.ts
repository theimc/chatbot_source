import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { NavController, MenuController, IonContent, Platform, Events, AlertController, IonInput, ModalController, LoadingController } from '@ionic/angular';
import { Router } from  "@angular/router";
import { RoomInfo, UserInfo } from '../../providers/globalvars/globalvars';
import { $WebSocket } from 'angular2-websocket/angular2-websocket';
import { ServerProvider } from '../../providers/server/server';
import { DatabaseProvider } from '../../providers/database/database';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { SpeechRecognition } from '@ionic-native/speech-recognition/ngx';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { AttachmentsPage } from '../modal/attachments.page'
import { FileTransfer, FileTransferObject} from '@ionic-native/file-transfer/ngx';
import { File, FileEntry } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { HttpClient } from '@angular/common/http';
import { Chooser } from '@ionic-native/chooser/ngx';

@Component({
  selector: 'app-room',
  templateUrl: './room.page.html',
  styleUrls: ['./room.page.scss'],
})
export class RoomPage implements OnInit {
  
  @ViewChild(IonContent, {static: false}) content: IonContent;
  @ViewChild('input', {static: false})  textInput: IonInput;

  /* Web Socket */  
  ws: $WebSocket;

  /* Message */
  userId:String;  
  messages = [];
  message = "";
  cesleamessage = "";
  intentmessage = "";
  msgPos = "normal";
  startMsgId: String;  
  refresherEnabled = false;  
  infiniteEnabled = false;
  fetchFinish = false;

  /* STT, TTS */
  isRecording: Boolean;
  isReading: Boolean;

  /* False: mic True: keypad */
  device: Boolean = false;

  /* */
  cesleaMode: Boolean = false;

  /* */
  intentMode: String;
  summary : string = "";

  /* Event Reference */
  resumeReference: any;
  pauseReference: any;

  /* */
  fileid:string = "test";
  imageData: string = null;
  serverIp: string = "";
  lastImage: string = null;
  participants: any;
  images = [];
  filename: string= "";
  uploadimg : Boolean = false;

  loading:any;

  constructor(private  router:  Router, public navCtrl: NavController,
  public roomInfo: RoomInfo, public userInfo: UserInfo, private events: Events,
  private alertCtrl: AlertController, private menuCtrl: MenuController, 
  private serverProvider: ServerProvider, private platform: Platform, 
  private databaseProvider: DatabaseProvider, private inAppBrowser: InAppBrowser, 
  private speechRecognition: SpeechRecognition, private changeDetectorRef: ChangeDetectorRef, 
  private textToSpeech: TextToSpeech, private camera: Camera, public modalController: ModalController,private transfer: FileTransfer,
  private file: File, private filePath: FilePath, private loadingController: LoadingController, 
  public http: HttpClient, private chooser: Chooser) { 
  
    console.log('constructor RoomPage roomid = ' + this.roomInfo.getRoomId());
    this.userId = this.userInfo.getUserId();
    this.cesleaMode = false;
    this.intentMode = "0";
    
    this.serverIp = this.serverProvider.serverIp;  
    this.uploadimg = false;

    this.platform.ready().then(() => {    
      console.log('Platform Ready RoomPage'); 
      

      /* Background */
      this.pauseReference = this.platform.pause.subscribe((res) => {
        this.msgPos = "normal";
        this.stopReading();
        this.stopRecording();
        this.closeSocket();
      });

      /* Foreground */
      this.resumeReference = this.platform.resume.subscribe((res) => {
        this.msgPos = "normal";
        this.openSocket();
        this.serverProvider.getRoomInfo();
      });
    });
  }

  ngOnInit() {
	
  }

  /* Page Life Cycle */
  ionViewCanEnter() {
    console.log('ionViewCanEnter RoomPage');       
  }

  ionViewDidLoad() {    
    console.log('ionViewDidLoad RoomPage');    
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter RoomPage');    
    //this.menuCtrl.enable(true, 'roomMenu');   
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter RoomPage'); 
    this.openSocket();   
    this.content.scrollToBottom(0);
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave RoomPage');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave RoomPage');        
  }

  ionViewDidLeave() {    
    console.log('ionViewDidLeave RoomPage');
    this.menuCtrl.enable(false, 'roomMenu');
    console.log('============================================');    
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload RoomPage');        
  }

  /* Menu Toggle */
  menuToggle() {    
    console.log('menuToggle == '); 
    this.menuCtrl.enable(true, 'roomMenu');   
    this.menuCtrl.toggle();
  }

  /* Input Device Toggle */
  deviceToggle() {
    if(this.device && this.isRecording) {
      this.stopRecording();
    }
    this.device = !this.device;
  }

  /* Socket Open */
  openSocket() {
    this.ws = new $WebSocket("ws://" + this.serverProvider.serverIp + "/chat/room/");

    this.onMessage();

    this.ws.onOpen(res => {
      if(res.isTrusted) {
        this.initChat();
        this.fetch_messages();
      }
    });
  }

  /* Socket Open */
  closeSocket() {
    this.ws.close();
  }

  /* Init Chat */
  initChat() {
    let message = JSON.stringify({
      room_id: this.roomInfo.getRoomId(),
      command: 'init_chat', 
      username: this.userInfo.getUserId(),
      state: this.fetchFinish
    });    
    
    this.ws.send(message).subscribe(
      res => { console.log("Init Chat : " + res) },
      err => { console.log("Init Chat(Err) : " + err) }
    );
  }

  /* Fetch Message */
  fetch_messages() {
    let msgId: String;

    if(this.msgPos == "up") {
      msgId = this.startMsgId;
    } else {
      msgId = this.roomInfo.getLastMsgId();      
    }

    let message = JSON.stringify({
      room_id: this.roomInfo.getRoomId(),
      command: 'fetch_messages',
      pos: this.msgPos,
      msgId: msgId
    });
        
    this.ws.send(message).subscribe(
      res => { console.log("Fetch Message : " + res) },
      err => { console.log("Fetch Message(Err) : " + err) }
    );    
  }

  /* Send Message */
  sendMessage() {

    console.log("intentMode == " + this.intentMode)

    if(this.intentMode != '0' && this.intentMode != '') {

      let message = JSON.stringify({
        command: 'intent_message', text: this.message, lan: this.roomInfo.getLan(), intent: this.intentMode
      });
  
      console.log("sendMessage == " + message)
      this.ws.send(message).subscribe(
        res => { console.log("Send Message : " + res) },
        err => { console.log("Send Message(Err) : " + err) }
      );

      this.intentMode = "0";

    } else {
      let message = JSON.stringify({
        command: 'new_message', text: this.message, lan: this.roomInfo.getLan()
      });
  
      console.log("sendMessage == " + message)
      this.ws.send(message).subscribe(
        res => { console.log("Send Message : " + res) },
        err => { console.log("Send Message(Err) : " + err) }
      );
  
      if(this.roomInfo.getMode() == 'MAX') {
        this.cesleamessage = this.message;
      }
    }

    /*let message = JSON.stringify({
      command: 'new_message', text: this.message, lan: this.roomInfo.getLan()
    });

    console.log("sendMessage == " + message)
    this.ws.send(message).subscribe(
      res => { console.log("Send Message : " + res) },
      err => { console.log("Send Message(Err) : " + err) }
    );

    if(this.roomInfo.getMode() == 'MAX') {
      this.cesleamessage = this.message;
    }*/

    /*if(this.roomInfo.getMode() == 'MAX') {

      this.cesleamessage = this.message;

      let message1 = JSON.stringify({
        command: 'ceslea_message', text: this.message, mode: this.roomInfo.getCategory()    
      });  
  
      this.ws.send(message1).subscribe(
        res => { console.log("Send Message : " + res) },
        err => { console.log("Send Message(Err) : " + err) }
      );
      
      if(this.device && this.isRecording) {
        this.cesleaMode = true;
      }
    } else {
      this.cesleaMode = false;
    }*/

    this.message = "";     

    console.log("device == " + this.device)
    /* Keyboard Focus */
    if(!this.device) {
      this.textInput.setFocus();
    }    
  }

  /* On Message */
  onMessage() {
    this.ws.onMessage((msg: MessageEvent) => {      
      let data = JSON.parse(msg.data);
      
      console.log("onMessage command :" + data.command);
      
      if(data.command == "init_messages") {
        console.log("Success Init Chat");
      } else if(data.command == "fetch_messages") {        

        console.log("Fetch Message :" + data.result);

        if(data.result == "True") {
          console.log("Success Fetch Message");
          
          if(data.upLast == "True") {
            this.refresherEnabled = false;            
          } else {
            this.refresherEnabled = true;            
          }

          if(data.downLast == "True") {
            this.infiniteEnabled = false;            
          } else {
            this.infiniteEnabled = true;            
          }
          
          if(this.msgPos == "up") {
            this.messages = data.messages.concat(this.messages);
            this.startMsgId = this.messages[0].id;          
          } else {
            if(this.msgPos == "normal") {
              if(data.messages.length !=0) {
                this.startMsgId = data.messages[0].id;
              }
            }
            
            for(let i=0; i<data.messages.length; i++) {

              if(data.messages[i].type == 'message') {
                this.summary = this.summary.concat(data.messages[i].content);
                //this.summary = this.summary.concat(" ");
              } else if(data.messages[i].type == 'file') {
                var filePath = data.messages[i].content
                var fileExtension = filePath.substr(filePath.lastIndexOf('.') + 1);
                var fileName = filePath.substr(filePath.lastIndexOf('/') + 1);
                console.log("file_message fileExtension : " + fileExtension)
                console.log("file_message fileName : " + fileName)
                if(fileExtension == "jpg" || fileExtension == "jpeg" || fileExtension == "png" || fileExtension == "gif") {
                  data.messages[i].emotion = "0"
                } else {
                  data.messages[i].emotion = "1"
                }

                data.messages[i].intentdata = fileName
              }

              this.messages.push(data.messages[i]);

              if( i == (data.messages.length - 1) ) {
                this.databaseProvider.updateMsgId(data.messages[i].id);
              }            
            }            
          }
          
          if(!this.fetchFinish && !this.infiniteEnabled) {
            setTimeout(() => {
              this.content.scrollToBottom(0)
            }, 100);
          }
          
          setTimeout(() => {
            this.fetchFinish = true;
          }, 100)
        } else {
          console.log("Fetch Message :" + data.result);
        }
      } else if(data.command == "new_message") {        

        if(!this.infiniteEnabled && this.fetchFinish) {
          if(data.message.author == "system") {
            this.serverProvider.getRoomInfo();
          }
  
          if(this.roomInfo.getTTSOption() && data.message.author != this.userInfo.getUserId()) {
            this.startReading(data.message.content);
          }
  
          if(data.message.type == 'message') {
            this.summary = this.summary.concat(data.message.content);
            //this.summary = this.summary.concat(" ");
          }

          this.messages.push(data.message);
          this.databaseProvider.updateMsgId(data.message.id);

          if(data.message.type == 'message') {
            
            if(data.message.intent == '' || data.message.intent == '0' ) {
              if(this.roomInfo.getMode() == 'MAX' && this.cesleamessage != '') {
                console.log("cesleamessage :" + this.cesleamessage);
                let message1 = JSON.stringify({
                  command: 'ceslea_message', text: this.cesleamessage, mode: this.roomInfo.getCategory()    
                });  
            
                this.ws.send(message1).subscribe(
                  res => { console.log("Send Message : " + res) },
                  err => { console.log("Send Message(Err) : " + err) }
                );
    
                this.cesleamessage = "";
    
                if(this.device && this.isRecording) {
                  this.cesleaMode = true;
                }
              } else {
                this.cesleaMode = false;
              }
            } else {
              if(this.device && this.isRecording) {
                
                this.stopRecording();
  
                this.textToSpeech.speak({
                  text: data.message.intentdata,
                  locale: this.roomInfo.getLan(),
                  rate: 1.0
                }).then(() => {
                  console.log("speak success"); 
                  setTimeout(() => {
                    this.startRecording();
                  }, 300);
                }).catch((reason: any) => {
                  console.log(reason);
                  this.startRecording();
                });              
              }
  
              this.intentMode = data.message.intent;
            }  
          } 
                    
          setTimeout(() => {
            this.content.scrollToBottom(0)
          }, 100);
        }        
      } else if(data.command == "file_message") {
        if(!this.infiniteEnabled && this.fetchFinish) {
          var filePath = data.message.content
          var fileExtension = filePath.substr(filePath.lastIndexOf('.') + 1);
          var fileName = filePath.substr(filePath.lastIndexOf('/') + 1);
          console.log("file_message fileExtension : " + fileExtension)
          console.log("file_message fileName : " + fileName)
          if(fileExtension == "jpg" || fileExtension == "jpeg" || fileExtension == "png" || fileExtension == "gif") {
            data.message.emotion = "0"
          } else {
            data.message.emotion = "1"
          }

          data.message.intentdata = fileName

          console.log("file_message data emotion 111: " + data.message.emotion)
          
          this.messages.push(data.message);
          this.databaseProvider.updateMsgId(data.message.id);

          setTimeout(() => {
            this.content.scrollToBottom(0)
          }, 100);
        }
            
      } else if(data.command == "ceslea_message") {
        if(data.cesType == "1") {
          if(!this.infiniteEnabled && this.fetchFinish) {

            if(this.roomInfo.getTTSOption() && data.message.author != this.userInfo.getUserId()) {
              this.startReading(data.message.content);
            }

            console.log("data.message.content :" + data.message.content);
            this.summary = this.summary.concat(data.message.content);
            //this.summary = this.summary.concat(" ");

            if(this.device && this.isRecording) {
              
              this.stopRecording();

              this.textToSpeech.speak({
                text: data.message.content,
                locale: this.roomInfo.getLan(),
                rate: 1.0
              }).then(() => {
                console.log("speak success"); 
                setTimeout(() => {
                  this.startRecording();
                }, 300);
              }).catch((reason: any) => {
                console.log(reason);
                this.startRecording();
              });              
            }
                       
            this.messages.push(data.message);
            this.databaseProvider.updateMsgId(data.message.id);
            setTimeout(() => {
              this.content.scrollToBottom(0)
            }, 100);
          }
        } else if(data.cesType == "2") {
          this.isRecording = false;
          this.msgPos = "down";
          let target = "_system";
          this.inAppBrowser.create(data.message.url, target);          
        }
      } else if(data.command == "intent_message") {
        
        this.messages.push(data.message);
        this.databaseProvider.updateMsgId(data.message.id);
        setTimeout(() => {
          this.content.scrollToBottom(0)
        }, 100);
      }
             
      setTimeout(() => {
        if(this.isRecording && this.cesleaMode == false) {
          this.reRecording();
        }
      }, 300);
      
    })                                    
  }

  reRecording() {  
    this.stopRecording();

    setTimeout(() => {
      this.startRecording();
    }, 700);    
  }
  
  /* Recording Start */
  startRecording() {    
    let options = {
      language: this.roomInfo.getLan(), //'en-US', //ko-KR
      matches: 1,
      showPopup: false      
    }
       
    this.speechRecognition.startListening(options)
    .subscribe(matches => {
      this.message = matches[0];
      this.sendMessage();      
    }, (err) => {
      this.stopRecording();
      console.log(err);
    });

    this.isRecording = true;
    this.changeDetectorRef.detectChanges();
  }

  /* Recording Stop */
  stopRecording() {
    this.speechRecognition.stopListening();
    this.isRecording = false;
    this.changeDetectorRef.detectChanges();   
  }

  /* Reading Start */
  startReading(message) {
    let callRecording = false;

    let option = {
      text: message,
      locale: this.roomInfo.getLan(), //'en-US', //ko-KR
      rate: 0.8
    }

    if(this.isRecording) {
      this.stopRecording();
      callRecording = true;
    }
    
    this.textToSpeech.speak(option).then(() => {
      if(this.device && callRecording) {
        this.startRecording();
      }
    }).catch((reason: any) => console.log(reason));
  }

  /* Reading Stop */
  stopReading() {    
    this.textToSpeech.speak("").then(() => {
      console.log("Stop Reading");
    }).catch((reason: any) => console.log(reason));    
  }

  /* Refresher */
  doRefresh(refresher) {    
    this.msgPos = "up";

    console.log("refresher refresherEnabled : " + this.refresherEnabled);
    if(this.refresherEnabled) {      
      this.fetch_messages();

      //let lastPos = await this.content.getScrollElement().contentHeight ;
      setTimeout(() => {
        this.content.scrollToBottom(0);
      }, 150);
      
    } else {
      this.refresherEnabled = false;
    }

    refresher.target.complete();
  }

  /* Infinite Scroll */
  doInfinite(infiniteScroll) {
    this.msgPos = "down";    
    
    if(this.infiniteEnabled) {          
      this.fetch_messages();
      infiniteScroll.target.complete();    
    } else {
      infiniteScroll.target.complete();
      infiniteScroll.target.enable(false);      
    }
  }

  checkFocus(event) {  
    setTimeout(() => {
      this.content.scrollToBottom(0);
    }, 300)
  }  

  openBrowser(url) {
    console.log("url == " + url);
    let target = "_self";
    let options ='location=no,toolbar=yes,hidden=no';
    this.inAppBrowser.create(url, target, options);
  }

  reportMessage(){
    this.reportMessageAlert();
  }

  async reportMessageAlert() {  

    const alert = await this.alertCtrl.create({
    header : '대화내용 보내기',
    message : '모든 대화내용을 보내서 대화내용을 요약을 합니다.',
    backdropDismiss: false,
    buttons: [{
       text: '닫기',
       handler: () => {
         console.log('Cancel clicked');
         alert.dismiss();
       }
     },
     {
       text: '보내기',
       handler: (data) => {
          console.log('OK clicked');
          this.showLoading("please wait...");
          this.serverProvider.setChatTest(this.summary, this.roomInfo.getLan()).then((res: any) => {
            console.log('summury res.result: ' + res.result);
            this.loaderDismiss();
            this.messageAlert('요약문 결과', res.result, '확인');
            alert.dismiss();
          },(err) => {
            console.log("summury error");
            this.loaderDismiss();
            this.messageAlert('요약문 결과', "요약문 에러", '확인');
            alert.dismiss();
          })
          
          return false;
       }
     }
   ]
   });
   return await alert.present();  
 }

  getCalendar(item) {

  //this.roomInfo.roomId
    console.log("getCalendar item.roomId == : " + item.roomId);  
    this.router.navigateByUrl('/calendar?roomId=' + item.roomId);
  }

 async messageAlert(header, message, btn) {  
    const alert = await this.alertCtrl.create({
       header : header,
       message: message,
       buttons:  [{
         text: btn,
         handler: () => {
       
       }
     }]
    });
    return await alert.present();  
  }

  async showAttachFileModal() {
    const modal = await this.modalController.create({
      component: AttachmentsPage,
      cssClass: 'signInModal'//,
      //componentProps: { value: 123 }
    });
  
    modal.onDidDismiss()
    .then((data) => {
        console.log("onDidDismiss: " + data.data);
        if(data.data == '1'){
          this.getPicture(1);
          // let filename = this.createFileName(this.fileid);
          // this.serverProvider.setPhotoDelete(filename).then((res: any) => {
          //   if(res.result == "True") {  
          //     this.imageData = "/assets/imgs/default.jpg";
          //     var profileUrl = 'http://' + this.serverIp + '/media/default_img/user.jpg';
          //     console.log('File delete complete : '+ profileUrl);
          //     this.userInfo.setProfile(profileUrl);
          //   } 
  
          //   this.uploadimg = true;
          // })        
        } else if(data.data == '2'){
          this.getPicture(2);
        } else if(data.data == '3'){
          
          this.chooser.getFile()
          .then(file => {

                // console.log(file ? file.name : 'canceled')
                console.log("file name : " + file.name)
                console.log("mediaType : " + file.mediaType)
                console.log("uri : " + file.uri)
                
                this.filePath.resolveNativePath(file.uri)
                .then(filePath => {

                  let correctPath = filePath.substr(0, filePath.lastIndexOf('/') + 1);
                  console.log("correctPath " + correctPath)
                  let currentFile = file.name
                  console.log("currentFile " + currentFile)
                  var fileExtension = currentFile.substr(currentFile.lastIndexOf('.') + 1);
                  console.log('fileExtension: ' + fileExtension);
                  currentFile = new Date().toISOString().substring(0, 19);
                  currentFile = currentFile.replace(":", "");
                  currentFile = currentFile.replace(":", "");
                  console.log("sub currentFile " + currentFile) 

                  currentFile = currentFile + "." + fileExtension;
                  this.copyFileToLocalDir(correctPath, currentFile, currentFile);

                });                

              }
            )
          .catch((error: any) => console.error(error));

        }
  
      });
      return await modal.present();
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

                  console.log('currentName: ' + currentName);
                  console.log('correctPath: ' + correctPath);

                  var fileExtension = currentName.substr(currentName.lastIndexOf('.') + 1);
                  console.log('fileExtension: ' + fileExtension);
                  var currentFile = new Date().toISOString().substring(0, 19);
                  currentFile = currentFile.replace(":", "");
                  currentFile = currentFile.replace(":", "");
                  console.log("sub currentFile " + currentFile) 

                  currentFile = currentFile + "." + fileExtension;
                  console.log("currentFile " + currentFile) 
                  
                  this.copyFileToLocalDir(correctPath, currentName, currentFile);
  
                });
        } else {
  
            this.imageData = 'data:image/jpeg;base64,' + imagePath;
            var correctPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
            var currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);          
            
            console.log('currentName 11: ' + currentName);
            console.log('correctPath 11: ' + correctPath);

            var fileExtension = currentName.substr(currentName.lastIndexOf('.') + 1);
            console.log('fileExtension 11: ' + fileExtension);
            var currentFile = new Date().toISOString().substring(0, 19);
            currentFile = currentFile.replace(":", "");
            currentFile = currentFile.replace(":", "");
            console.log("sub currentFile 11 " + currentFile) 

            currentFile = currentFile + "." + fileExtension;
            console.log("currentFile 11 " + currentFile) 

            this.copyFileToLocalDir(correctPath, currentName, currentFile);
        }
      }, (err) => {
        console.log(err);
      });
    }
  
    createFileName(filename) {
      return filename +".jpg";
    }
  
    readFileName(id) {
      return id +".jpg";
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
          this.http.post('http://' + this.serverIp + '/chat/file/', formData, header)
          .subscribe((res: any)  => {
              console.log('readFile res==' + res.result);
              if(res.result == 'True') {
                console.log('File upload res.url : '+ res.url);
                var profileUrl = 'http://' + this.serverIp + '/' + res.url;
                let message = JSON.stringify({
                  command: 'file_message', text: profileUrl
                });
            
                console.log("file sendMessage == " + message)
                this.ws.send(message).subscribe(
                  res => {
                    console.log("file Send Message : " + res) 
                    this.uploadimg = true;
                  },
                  err => { console.log("file Send Message(Err) : " + err) }
                );
            
                // this.uploadimg = true;

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

    getDownload(filePath) {
      console.log('filePath == '+ filePath);
      this.downloadFile(filePath);
    }

    getPermission(filePath) {

      this.downloadFile(filePath);
      // this.androidPermissions.hasPermission(this.androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE)
      //   .then(status => {
      //     if (status.hasPermission) {
      //       this.downloadFile(filePath);
      //     } 
      //     else {
      //       this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE)
      //         .then(status => {
      //           if(status.hasPermission) {
      //             this.downloadFile(filePath);
      //           }
      //         });
      //     }
      //   });
    }

    downloadFile(filePath) {
      let filename = filePath.substr(filePath.lastIndexOf('/') + 1);
      console.log('filename == '+ filename);
      var storageLocation = "";

      if(this.platform.is('android')) {
        storageLocation = 'file:///storage/emulated/0/' + filename;
      } else {

      }
      
      let url = filePath;
      const fileTransfer: FileTransferObject = this.transfer.create();
      fileTransfer.download(url, storageLocation).then((entry) => {
        console.log('fileTransfer.download data ** ** ** **:' + JSON.stringify(entry));
        this.messageAlert('파일 저장', "파일 저장에 성공하였습니다.", '확인');
      }, (err) => {
        // handle error
        console.log("downloadfile() error: " + JSON.stringify(err));
      });
    }

    async showLoading(data) {
      this.loading = await this.loadingController.create({
          message: data,
          spinner: 'dots'
      });
      return await this.loading.present();
    }
  
    async loaderDismiss(){
      this.loading = await this.loadingController.dismiss();
    }
}
