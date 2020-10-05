import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { HttpClientModule } from '@angular/common/http';
import { NativePageTransitions } from '@ionic-native/native-page-transitions/ngx';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { Firebase } from '@ionic-native/firebase/ngx';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SpeechRecognition } from '@ionic-native/speech-recognition/ngx';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';
import { Dialogs } from '@ionic-native/dialogs/ngx';
import { Camera } from '@ionic-native/camera/ngx';
import { CameraPage} from '../app/modal/camera.page'
import { AttachmentsPage} from '../app/modal/attachments.page'
import { FileTransfer} from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { Chooser } from '@ionic-native/chooser/ngx';
/* Provider */
import { ServerProvider } from '../providers/server/server';
import { GlobalvarsProvider, UserInfo, RoomInfo } from '../providers/globalvars/globalvars';
import { DatabaseProvider } from '../providers/database/database';
import { FcmProvider } from '../providers/fcm/fcm';
import { StorageProvider } from '../providers/storage/storage';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
// import { Facebook } from '@ionic-native/facebook/ngx';

const firebase = {
  apiKey: "AIzaSyBkHYEA09za6LmlvjUgPAJ1atWVQfSNsBw",
  authDomain: "ceslea-55841.firebaseapp.com",
  databaseURL: "https://ceslea-55841.firebaseio.com",
  projectId: "ceslea-55841",
  storageBucket: "ceslea-55841.appspot.com",
  messagingSenderId: "647320813926"
}

@NgModule({
  declarations: [AppComponent, CameraPage, AttachmentsPage],
  entryComponents: [CameraPage, AttachmentsPage],  
  imports: [
    BrowserModule, 
    FormsModule, 
    ReactiveFormsModule, 
    HttpClientModule, 
    IonicModule.forRoot(), 
    AppRoutingModule, 
    AngularFireModule.initializeApp(firebase),
    AngularFirestoreModule
    ],
  providers: [
    StatusBar,
    SplashScreen,
    NativePageTransitions,
    NativeStorage,
    Firebase, 
    SQLite,
    InAppBrowser,
    SpeechRecognition,
    TextToSpeech,
    LocalNotifications,
    Dialogs,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    ServerProvider,
    GlobalvarsProvider, UserInfo, RoomInfo,
    DatabaseProvider,
    FcmProvider,
    StorageProvider,
    Camera,
    FileTransfer,
    File,
    FilePath,
    Chooser,
    GooglePlus,
    // Facebook,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
