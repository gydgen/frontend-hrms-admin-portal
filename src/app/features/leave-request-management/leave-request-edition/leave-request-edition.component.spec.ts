import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LeaveRequestEditionComponent } from './leave-request-edition.component';

describe('LeaveRequestEditionComponent', () => {
  let component: LeaveRequestEditionComponent;
  let fixture: ComponentFixture<LeaveRequestEditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveRequestEditionComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveRequestEditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
