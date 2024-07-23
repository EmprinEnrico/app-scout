import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JurneyComponent } from './jurney.component';

describe('JurneyComponent', () => {
  let component: JurneyComponent;
  let fixture: ComponentFixture<JurneyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JurneyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JurneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
