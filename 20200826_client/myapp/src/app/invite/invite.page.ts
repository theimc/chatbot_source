import { Component, OnInit} from '@angular/core';
import { NavController} from '@ionic/angular';
import { Router } from  "@angular/router";
import { ServerProvider } from '../../providers/server/server';
import { RoomInfo } from '../../providers/globalvars/globalvars';

@Component({
  selector: 'app-invite',
  templateUrl: './invite.page.html',
  styleUrls: ['./invite.page.scss'],
})
export class InvitePage implements OnInit {
  
  myInput: String = "";
  friends = [];
  inviteList = [];

  constructor(public  router:  Router, public navCtrl: NavController,
	public serverProvider: ServerProvider, public roomInfo: RoomInfo) { 
  
    console.log('constructor InvitePage');
   
  }

  ngOnInit() {
	
  }

  /* Page Life Cycle */
  ionViewCanEnter() {
    console.log('ionViewCanEnter InvitePage');       
  }

  ionViewDidLoad() {    
    console.log('ionViewDidLoad InvitePage');    
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter InvitePage');
    this.getFriendList();
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter InvitePage'); 
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave InvitePage');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave InvitePage');        
  }

  ionViewDidLeave() {    
    console.log('ionViewDidLeave InvitePage');
    console.log('============================================');    
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload InvitePage');        
  }

  /* Get Friend List */
  getFriendList() {
    this.serverProvider.getFriendList().then((res: any) => {
      this.friends = res;
    });
  }
  
   /* CheckBox Disable */
  checkboxDisable(item) {
    let list = this.roomInfo.getParticipants();
    
    for(let i=0; i<list.length; i++) {
      if(list[i].id == item.id) {
        return true;
      }    
    }
    
    return false;
  }

  /* Update Select */
  updateSelect(id, event) {
    const index = this.inviteList.indexOf(id, 0);

    if(event.value) {
      this.inviteList.push(id);
    } else {
      if(index > -1) {
        this.inviteList.splice(index, 1);
      }
    }   
  }

  /* Invite */
  invite() {
    this.serverProvider.invite(this.inviteList).then((res: any) => {      
      if(res.result = "True") {               
        this.serverProvider.requestRoomId(res.participants, this.roomInfo.getRoomId())
        .then(res => {
          this.navCtrl.pop();
        });        
      }
    })   
  }

  shouldShowCancel(){

  }

  onInput(event) {
  
  }

  onCancel(event) {
  
  }
}
