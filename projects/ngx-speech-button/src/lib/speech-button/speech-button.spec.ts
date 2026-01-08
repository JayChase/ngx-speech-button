/// <reference types="dom-speech-recognition" />

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgWindow, WINDOW } from '../ng-window/ng-window';
import { SpeechButton, SpeechRecognitionConfig } from './speech-button';

// Mock SpeechRecognition
class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  grammars: SpeechGrammarList | null = null;

  onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
  onend: ((event: Event) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;

  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

function createMockWindow(hasSpeechRecognition = true): NgWindow {
  const mockRecognition = new MockSpeechRecognition();
  return {
    navigator: { language: 'en-GB' },
    webkitSpeechRecognition: hasSpeechRecognition ? MockSpeechRecognition : undefined,
    SpeechRecognition: hasSpeechRecognition ? MockSpeechRecognition : undefined,
  } as unknown as NgWindow;
}

function createMockSpeechRecognitionEvent(
  transcripts: string[],
  isFinal = true
): SpeechRecognitionEvent {
  const results = transcripts.map((transcript) => {
    const result = {
      0: { transcript, confidence: 0.9 } as SpeechRecognitionAlternative,
      length: 1,
      isFinal,
      item(index: number) {
        return this[index as keyof typeof this] as SpeechRecognitionAlternative;
      },
      [Symbol.iterator]: function* () {
        yield { transcript, confidence: 0.9 } as SpeechRecognitionAlternative;
      },
    };
    return result;
  });

  const resultList = {
    ...results.reduce((acc, r, i) => ({ ...acc, [i]: r }), {}),
    length: results.length,
    item(index: number) {
      return results[index];
    },
    [Symbol.iterator]: function* () {
      for (const result of results) yield result;
    },
  };

  return {
    results: resultList,
    resultIndex: 0,
  } as unknown as SpeechRecognitionEvent;
}

function createMockErrorEvent(error: SpeechRecognitionErrorCode): SpeechRecognitionErrorEvent {
  return { error, message: `Error: ${error}` } as SpeechRecognitionErrorEvent;
}

@Component({
  template: `<button ngxSpeechButton [config]="config"></button>`,
  imports: [SpeechButton],
})
class TestHostComponent {
  config: SpeechRecognitionConfig = {};
}

describe('SpeechButton', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let directive: SpeechButton;
  let mockWindow: NgWindow;

  beforeEach(async () => {
    mockWindow = createMockWindow(true);

    // Mock global window SpeechRecognition
    (globalThis as any).SpeechRecognition = MockSpeechRecognition;
    (globalThis as any).webkitSpeechRecognition = MockSpeechRecognition;

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: WINDOW, useValue: mockWindow }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();

    const directiveEl = fixture.debugElement.query(By.directive(SpeechButton));
    directive = directiveEl.injector.get(SpeechButton);
  });

  afterEach(() => {
    // Clean up global mocks
    delete (globalThis as any).SpeechRecognition;
    delete (globalThis as any).webkitSpeechRecognition;
  });

  describe('initialization', () => {
    it('should create the directive', () => {
      expect(directive).toBeTruthy();
    });

    it('should set available to true when Web Speech API is supported', () => {
      expect(directive.available()).toBe(true);
    });

    it('should create a SpeechRecognition instance', () => {
      expect(directive.recognition).toBeTruthy();
    });

    it('should apply default config values', () => {
      expect(directive.recognition?.lang).toBe('en-GB');
      expect(directive.recognition?.continuous).toBe(true);
      expect(directive.recognition?.interimResults).toBe(false);
      expect(directive.recognition?.maxAlternatives).toBe(1);
    });
  });

  describe('when Web Speech API is not available', () => {
    beforeEach(async () => {
      const noSpeechWindow = createMockWindow(false);

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [{ provide: WINDOW, useValue: noSpeechWindow }],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();

      const directiveEl = fixture.debugElement.query(By.directive(SpeechButton));
      directive = directiveEl.injector.get(SpeechButton);
    });

    it('should set available to false', () => {
      expect(directive.available()).toBe(false);
    });

    it('should not create a SpeechRecognition instance', () => {
      expect(directive.recognition).toBeNull();
    });
  });

  describe('config input', () => {
    it('should apply custom config values', async () => {
      await TestBed.resetTestingModule();
      mockWindow = createMockWindow(true);

      @Component({
        template: `<button ngxSpeechButton [config]="config"></button>`,
        imports: [SpeechButton],
      })
      class ConfigTestComponent {
        config: SpeechRecognitionConfig = {
          lang: 'fr-FR',
          continuous: false,
          interimResults: true,
          maxAlternatives: 3,
        };
      }

      await TestBed.configureTestingModule({
        imports: [ConfigTestComponent],
        providers: [{ provide: WINDOW, useValue: mockWindow }],
      }).compileComponents();

      const configFixture = TestBed.createComponent(ConfigTestComponent);
      configFixture.detectChanges();

      const directiveEl = configFixture.debugElement.query(By.directive(SpeechButton));
      const configDirective = directiveEl.injector.get(SpeechButton);

      expect(configDirective.recognition?.lang).toBe('fr-FR');
      expect(configDirective.recognition?.continuous).toBe(false);
      expect(configDirective.recognition?.interimResults).toBe(true);
      expect(configDirective.recognition?.maxAlternatives).toBe(3);
    });
  });

  describe('click behavior', () => {
    it('should toggle listening state on click', () => {
      expect(directive.listening()).toBe(false);

      const button = fixture.debugElement.query(By.css('button'));
      button.triggerEventHandler('click', new MouseEvent('click'));

      expect(directive.listening()).toBe(true);
    });

    it('should start recognition when listening becomes true', () => {
      const button = fixture.debugElement.query(By.css('button'));
      button.triggerEventHandler('click', new MouseEvent('click'));

      expect(directive.recognition?.start).toHaveBeenCalled();
    });

    it('should stop recognition when listening becomes false', () => {
      const button = fixture.debugElement.query(By.css('button'));

      // Start listening
      button.triggerEventHandler('click', new MouseEvent('click'));
      // Stop listening
      button.triggerEventHandler('click', new MouseEvent('click'));

      expect(directive.recognition?.stop).toHaveBeenCalled();
    });
  });

  describe('transcriptChanged output', () => {
    it('should emit transcript when speech is recognized', () => {
      const transcriptChangedSpy = vi.fn();
      directive.transcriptChanged.subscribe(transcriptChangedSpy);

      const mockEvent = createMockSpeechRecognitionEvent(['Hello world']);
      directive.recognition?.onresult?.(mockEvent);

      expect(transcriptChangedSpy).toHaveBeenCalledWith('Hello world');
    });

    it('should accumulate multiple results', () => {
      const transcriptChangedSpy = vi.fn();
      directive.transcriptChanged.subscribe(transcriptChangedSpy);

      const mockEvent = createMockSpeechRecognitionEvent(['Hello ', 'world']);
      directive.recognition?.onresult?.(mockEvent);

      expect(transcriptChangedSpy).toHaveBeenCalledWith('Hello world');
    });
  });

  describe('transcriptCompleted output', () => {
    it('should emit final transcript on recognition end', () => {
      const transcriptCompletedSpy = vi.fn();
      directive.transcriptCompleted.subscribe(transcriptCompletedSpy);

      // Simulate speech result
      const mockEvent = createMockSpeechRecognitionEvent(['Hello world']);
      directive.recognition?.onresult?.(mockEvent);

      // Simulate recognition end
      directive.recognition?.onend?.(new Event('end'));

      expect(transcriptCompletedSpy).toHaveBeenCalledWith('Hello world');
    });

    it('should not emit if no transcript was captured', () => {
      const transcriptCompletedSpy = vi.fn();
      directive.transcriptCompleted.subscribe(transcriptCompletedSpy);

      // Simulate recognition end without any results
      directive.recognition?.onend?.(new Event('end'));

      expect(transcriptCompletedSpy).not.toHaveBeenCalled();
    });

    it('should reset transcript after completion', () => {
      const transcriptCompletedSpy = vi.fn();
      directive.transcriptCompleted.subscribe(transcriptCompletedSpy);

      // First session
      directive.recognition?.onresult?.(createMockSpeechRecognitionEvent(['First']));
      directive.recognition?.onend?.(new Event('end'));

      // Second session with no results
      directive.recognition?.onend?.(new Event('end'));

      expect(transcriptCompletedSpy).toHaveBeenCalledTimes(1);
      expect(transcriptCompletedSpy).toHaveBeenCalledWith('First');
    });

    it('should set listening to false on recognition end', () => {
      // Start listening
      const button = fixture.debugElement.query(By.css('button'));
      button.triggerEventHandler('click', new MouseEvent('click'));
      expect(directive.listening()).toBe(true);

      // Simulate recognition end
      directive.recognition?.onend?.(new Event('end'));

      expect(directive.listening()).toBe(false);
    });
  });

  describe('error output', () => {
    it('should emit error events', () => {
      const errorSpy = vi.fn();
      directive.error.subscribe(errorSpy);

      const mockError = createMockErrorEvent('no-speech');
      directive.recognition?.onerror?.(mockError);

      expect(errorSpy).toHaveBeenCalledWith(mockError);
    });

    it('should filter out aborted errors', () => {
      const errorSpy = vi.fn();
      directive.error.subscribe(errorSpy);

      const mockError = createMockErrorEvent('aborted');
      directive.recognition?.onerror?.(mockError);

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should emit other error types', () => {
      const errorSpy = vi.fn();
      directive.error.subscribe(errorSpy);

      const errors: SpeechRecognitionErrorCode[] = [
        'no-speech',
        'audio-capture',
        'not-allowed',
        'network',
      ];

      errors.forEach((errorCode) => {
        const mockError = createMockErrorEvent(errorCode);
        directive.recognition?.onerror?.(mockError);
      });

      expect(errorSpy).toHaveBeenCalledTimes(4);
    });
  });
});
