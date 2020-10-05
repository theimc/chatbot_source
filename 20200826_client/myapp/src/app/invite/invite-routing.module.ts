import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InvitePage } from './invite.page';

const routes: Routes = [
  {
    path: '',
    component: InvitePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InvitePageRoutingModule {}
