import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { JourneyComponent } from './journey.component';
import { DatahandlerService, GoalWithSteps } from '../services/datahandler.service';

describe('JourneyComponent', () => {
  let component: JourneyComponent;
  let fixture: ComponentFixture<JourneyComponent>;
  const goal: GoalWithSteps = {
    id: 1,
    title: 'Test goal',
    description: '',
    statusOverride: 'auto',
    sortOrder: 1,
    createdAt: '',
    archivedAt: null,
    updatedAt: '',
    progress: {
      totalTasks: 1,
      completedTasks: 0,
      percent: 0,
      isComplete: false,
    },
    steps: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JourneyComponent],
      providers: [
        provideIonicAngular(),
        {
          provide: DatahandlerService,
          useValue: {
            initialize: async () => undefined,
            getGoals: async () => [goal],
            getSelectedGoalId: async () => goal.id,
            setSelectedGoalId: async () => undefined,
            getGoalWithSteps: async () => goal,
            createGoal: async () => goal.id,
            updateGoal: async () => undefined,
            archiveGoal: async () => undefined,
            deleteGoal: async () => undefined,
            createStep: async () => 1,
            updateStep: async () => undefined,
            deleteStep: async () => undefined,
            createTask: async () => 1,
            updateTask: async () => undefined,
            deleteTask: async () => undefined,
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(JourneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
