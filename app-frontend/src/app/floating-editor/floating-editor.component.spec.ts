import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingEditorComponent } from './floating-editor.component';

describe('FloatingEditorComponent', () => {
  let component: FloatingEditorComponent;
  let fixture: ComponentFixture<FloatingEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
