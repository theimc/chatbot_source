import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { InvitePageRoutingModule } from './invite-routing.module';
import { InvitePage } from './invite.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InvitePageRoutingModule
  ],
  declarations: [InvitePage]
})
export class InvitePageModule {}
