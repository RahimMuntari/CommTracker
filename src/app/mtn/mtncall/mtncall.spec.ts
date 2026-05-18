import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mtncall } from './mtncall';

describe('Mtncall', () => {
  let component: Mtncall;
  let fixture: ComponentFixture<Mtncall>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mtncall]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mtncall);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
