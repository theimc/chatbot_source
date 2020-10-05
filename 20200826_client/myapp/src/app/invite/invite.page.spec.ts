import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { InvitePage } from './invite.page';

describe('InvitePage', () => {
  let component: InvitePage;
  let fixture: ComponentFixture<InvitePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvitePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(InvitePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
