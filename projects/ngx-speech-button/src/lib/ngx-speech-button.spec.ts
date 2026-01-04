import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxSpeechButton } from './ngx-speech-button';

describe('NgxSpeechButton', () => {
  let component: NgxSpeechButton;
  let fixture: ComponentFixture<NgxSpeechButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxSpeechButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxSpeechButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
