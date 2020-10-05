import { Component, OnInit} from '@angular/core';
import { NavController, Platform, ModalController } from '@ionic/angular';
import { Router } from  "@angular/router";

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
})
export class CameraPage implements OnInit {
  
  constructor(public  router:  Router, public navCtrl: NavController, private platform: Platform,
    private modalCtrl:ModalController) { 
  
    console.log('constructor CameraPage');
   
  }

  ngOnInit() {
	
  }

  /* Page Life Cycle */
  ionViewCanEnter() {
    console.log('ionViewCanEnter CameraPage');       
  }

  ionViewDidLoad() {    
    console.log('ionViewDidLoad CameraPage');    
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter CameraPage');
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter CameraPage'); 
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave CameraPage');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave CameraPage');        
  }

  ionViewDidLeave() {    
    console.log('ionViewDidLeave CameraPage');
    console.log('============================================');    
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload CameraPage');        
  }

  closeModal(data : String) {
    this.modalCtrl.dismiss(data);
  }

}
