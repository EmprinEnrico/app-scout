import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { JurneyComponent } from './jurney.component';
import { DatahandlerService, GoalWithSteps } from '../services/datahandler.service';

describe('JurneyComponent', () => {
  let component: JurneyComponent;
  let fixture: ComponentFixture<JurneyComponent>;
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
      imports: [JurneyComponent],
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

    fixture = TestBed.createComponent(JurneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
