import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PayrollEditionComponent } from './payroll-edition.component';

describe('PayrollEditionComponent', () => {
  let component: PayrollEditionComponent;
  let fixture: ComponentFixture<PayrollEditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayrollEditionComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PayrollEditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
