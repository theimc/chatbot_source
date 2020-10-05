import { Component } from '@angular/core';
import { NavController, AlertController} from '@ionic/angular';
import { Router } from  "@angular/router";
import { UserInfo } from '../../providers/globalvars/globalvars';
import { ServerProvider } from '../../providers/server/server';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  user: any;
  friends: any = [];
  allFriends : any = [];
  participants: any;
  searchQuery: string = null;
  filename: string = "";
  serverIp: string = "";
  
  constructor(private  router:  Router, public navCtrl: NavController, private userInfo: UserInfo, 
    private serverProvider: ServerProvider, private alertCtrl: AlertController) {    
      this.user = this.userInfo.getUserInfo();
      this.serverIp = this.serverProvider.serverIp;      
      console.log("setProfile this.user.profile == : " + this.user.profile );  
  }

  ngOnInit() {
    console.log('ionViewCanEnter Tab1 ngOnInit'); 
  }

  /* Page Life Cycle */
  ionViewCanEnter() {
    console.log('ionViewCanEnter Tab1');        
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad Tab1');  
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter Tab1');   
    this.user = this.userInfo.getUserInfo();     

    this.filename = this.readFileName(this.user.userId);
    console.log("setProfile this.filename == : " + this.filename );  
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter Tab1');  
    this.getFriendList();  
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave Tab1');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave Tab1');        
  }

  ionViewDidLeave() {
    console.log('ionViewDidLeave Tab1');     
    console.log('============================================');
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload Tab1');        
  }

  /* Get Friend List */
  getFriendList() {    
    this.serverProvider.getFriendList().then((res: any) => {      
      this.friends = res;
      this.allFriends = this.friends;      
    });
  }

  /* Friend Delete */
  deleteFriend(slidingItem, item: any) {
    slidingItem.close();
    this.deleteFriendsAlert(item);
  }

  addFriends(fabItem) {
    this.addFriendsAlert();     
    fabItem.stopPropagation();       
  }

  /*searchFriends(fabItem: { close: () => void; }, friensItem: any) {
    fabItem.close();   
    this.searchFriendsAlert(friensItem);
  }*/

  addGroupAlert(fabItem) {
    this.groupAgentAlert();
    fabItem.stopPropagation();       
  }

  setProfile(item: { userId: string; userName: string;}) {
    console.log("setProfile item.userId == : " + item.userId);  
    this.router.navigateByUrl('/profile?id=' + item.userId + "&name=" + item.userName);
  }

  joinChatRoom (item) {
    this.searchQuery = '';
    this.friends = this.allFriends;
    this.router.navigateByUrl('/chat?id=' + item.id + '&name=' + item.is_name + '&status=' + item.status_message + '&img=' + encodeURI(item.profile_image));
  }

  /* Room Join */
  joinRoom(slidingItem: { close: () => void; }, item: { id: string; }) {

    slidingItem.close();
    this.participants = [];
    this.participants.push(item.id);
    
    this.serverProvider.requestRoomId(this.participants, null).then(res => {
      //this.navCtrl.getRootNavs()[0].push(RoomPage);
      this.router.navigateByUrl('/room');
    });
  }

  onSearchTerm(ev: CustomEvent) {
    
    this.friends = this.allFriends;
    const val = ev.detail.value;

    if (val && val.trim() !== '') {
      this.friends = this.friends.filter(item  => {
        // return item.id.toLowerCase().indexOf(val.trim().toLowerCase()) > -1;
        return item.is_name.indexOf(val.trim().toLowerCase()) > -1;
      });
    } else {
      this.friends = this.allFriends;
    }
  }

  async deleteFriendsAlert(item: { id: any; }) {  
     const alert = await this.alertCtrl.create({
     header : 'Delete',
     message: item.id,
     buttons: [{
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      },
      {
        text: 'Delete',
        handler: () => {
          console.log('Add clicked');
	        this.serverProvider.deleteFriend(item).then((res: any) => {
            if(res.result = "True") {
              this.getFriendList();
            }
          })
        }
      }
    ]
    });
     return await alert.present();  
  }
  
  async addFriendsAlert() {  
     const alert = await this.alertCtrl.create({
     header : '친구 추가',
     inputs: [{
         name: 'friendId',
         placeholder: 'Friend ID'
     }],
     buttons: [{
        text: '취소',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      },
      {
        text: '추가',
        handler: (data) => {
          console.log('Add clicked');
	        if (data.friendId.trim() != '') {
            this.serverProvider.addFriends(data).then((res: any) => {
              if(res.result == "True") {                                
                this.getFriendList();
                alert.dismiss();
              } else if(res.result == "Overlap") {
                alert.message = data.friendId + " is already registered"; 
              } else {
                alert.message = "Unable to register, Please check User ID.";
              }
            })
          } else {
            alert.message = "Please enter Friend ID.";
          }
          return false;
        }
      }
    ]
    });
    return await alert.present();  
  }

  readFileName(id) {
    return id +".jpg";
  }

  /*async searchFriendsAlert(friensItem: any) {  
    const alert = await this.alertCtrl.create({
    header : 'Search Friend',
    inputs: [{
        name: 'friendId',
        placeholder: 'Friend ID'
    }],
    buttons: [{
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        console.log('Cancel clicked');
      }
    },
    {
      text: 'Search',
      handler: (data) => {
        console.log('Search clicked');
        console.log('data.name : ' + data.friendId);
        for(let friend of friensItem){
          console.log('friens id : ' + friend.id);
          if(data.friendId == friend.id){
            
          } else {
            
          }
          
        }

        alert.dismiss();
      }
    }]
   });
   return await alert.present();  
  }*/
  
  async groupAgentAlert() {  
    const alert = await this.alertCtrl.create({
    header : '그룹관리',

    
    inputs: [{
        name: 'groupId',
        placeholder: '그룹명'
    }],
    buttons: [{
       text: '취소',
       role: 'cancel',
       handler: () => {
         console.log('Cancel clicked');
       }
     },
     {
       text: '추가',
       handler: (data) => {
         console.log('Add clicked');

         alert.dismiss();
       }
     }
   ]
   });
   return await alert.present();  
  }

}
