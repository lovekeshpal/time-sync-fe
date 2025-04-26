import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerScreenComponent } from './timer-screen.component';

describe('TimerScreenComponent', () => {
  let component: TimerScreenComponent;
  let fixture: ComponentFixture<TimerScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimerScreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimerScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
