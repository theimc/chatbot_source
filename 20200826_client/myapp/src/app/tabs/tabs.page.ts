import { Component } from '@angular/core';
import { GlobalvarsProvider } from '../../providers/globalvars/globalvars';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {

  constructor(public globalvarsProvider: GlobalvarsProvider) {}
  
  /* Page Life Cycle */
  ionViewCanEnter() {
    console.log('ionViewCanEnter TabPage');   
         
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TabPage');    
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter TabPage');    
  }
  
  ionViewDidEnter() {
    console.log('ionViewDidEnter TabPage');            
  }

  ionViewCanLeave() {
    console.log('ionViewCanLeave TabPage');        
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave TabPage');        
  }

  ionViewDidLeave() {
    console.log('ionViewDidLeave TabPage');
    console.log('============================================');      
  }

  ionViewWillUnload() {
    console.log('ionViewWillUnload TabPage');        
  }
}
