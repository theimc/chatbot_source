import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [ 
  /*{
    path: '',
    loadChildren: './home/home.module#HomePageModule'
  },*/
  {
    path: 'login',
    loadChildren: './auth/login/login.module#LoginPageModule'
  },
  {
    path: 'app',
    loadChildren: './tabs/tabs.module#TabsPageModule'
  },
  {
    path: 'room',
    loadChildren: './room/room.module#RoomPageModule'
  },
  {
    path: 'invite',
    loadChildren: './invite/invite.module#InvitePageModule'
  },
  {
    path: 'profile',
    loadChildren: './profile/profile.module#ProfilePageModule'
  },
  {
    path: 'chat',
    loadChildren: './chat/chat.module#ChatPageModule'
  },
  {
    path: 'calendar',
    loadChildren: './calendar/calendar.module#CalendarPageModule'
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
