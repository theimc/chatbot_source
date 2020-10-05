import { Component, OnInit} from '@angular/core';
import { NavController, Platform, ModalController } from '@ionic/angular';
import { Router } from  "@angular/router";

@Component({
  selector: 'app-attachments',
  templateUrl: './attachments.page.html',
  styleUrls: ['./attachments.page.scss'],
})
export class AttachmentsPage implements OnInit {
  
  constructor(public  router:  Router, public navCtrl: NavController, private platform: Platform,
    private modalCtrl:ModalController) { 
  
    console.log('constructor AttachmentsPage');
   
  }

  ngOnInit() {
	
  }

  /* Page Life Cycle */
  ionViewCanEnter() {
    console.log('ionViewCanEnter AttachmentsPage');       
  }

  ionViewDidLoad() {    
    console.log('ionViewDidLoad AttachmentsPage');    
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter AttachmentsPage');
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter AttachmentsPage'); 
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave AttachmentsPage');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave AttachmentsPage');        
  }

  ionViewDidLeave() {    
    console.log('ionViewDidLeave AttachmentsPage');
    console.log('============================================');    
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload AttachmentsPage');        
  }

  closeModal(data : String) {
    this.modalCtrl.dismiss(data);
  }

}
