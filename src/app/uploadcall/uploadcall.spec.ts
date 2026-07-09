import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Uploadcall } from './uploadcall';

describe('Uploadcall', () => {
  let component: Uploadcall;
  let fixture: ComponentFixture<Uploadcall>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Uploadcall]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Uploadcall);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
