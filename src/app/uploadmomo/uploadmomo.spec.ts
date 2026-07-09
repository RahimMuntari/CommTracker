import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Uploadmomo } from './uploadmomo';

describe('Uploadmomo', () => {
  let component: Uploadmomo;
  let fixture: ComponentFixture<Uploadmomo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Uploadmomo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Uploadmomo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
