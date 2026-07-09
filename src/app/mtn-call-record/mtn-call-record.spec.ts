import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MtnCallRecord } from './mtn-call-record';

describe('MtnCallRecord', () => {
  let component: MtnCallRecord;
  let fixture: ComponentFixture<MtnCallRecord>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MtnCallRecord]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MtnCallRecord);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
