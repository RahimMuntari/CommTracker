import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Telecelcall } from './telecelcall';

describe('Telecelcall', () => {
  let component: Telecelcall;
  let fixture: ComponentFixture<Telecelcall>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Telecelcall]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Telecelcall);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
