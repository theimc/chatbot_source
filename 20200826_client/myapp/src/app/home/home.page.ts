import { Component, OnInit} from '@angular/core';
import { NavController, Platform} from '@ionic/angular';
import { Router } from  "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  
  constructor(public  router:  Router, public navCtrl: NavController, private platform: Platform) { 
  
    console.log('constructor HomePage');
   
  }

  ngOnInit() {
	
  }

  /* Page Life Cycle */
  ionViewCanEnter() {
    console.log('ionViewCanEnter HomePage');       
  }

  ionViewDidLoad() {    
    console.log('ionViewDidLoad HomePage');    
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter HomePage');
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter HomePage'); 
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave HomePage');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave HomePage');        
  }

  ionViewDidLeave() {    
    console.log('ionViewDidLeave HomePage');
    console.log('============================================');    
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload HomePage');        
  }
}
