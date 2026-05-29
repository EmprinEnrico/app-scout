import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveComponent } from './archive.component';
import { DatahandlerService } from '../services/datahandler.service';

describe('ArchiveComponent', () => {
  let component: ArchiveComponent;
  let fixture: ComponentFixture<ArchiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveComponent],
      providers: [
        {
          provide: DatahandlerService,
          useValue: {
            initialize: async () => undefined,
            getGoalSummaries: async () => [],
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
