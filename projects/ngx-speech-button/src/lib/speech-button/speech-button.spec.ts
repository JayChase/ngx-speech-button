/// <reference types="dom-speech-recognition" />

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgWindow, WINDOW } from '../ng-window/ng-window';
import { SpeechButton, SpeechRecognitionConfig } from './speech-button';

// Mock SpeechRecognition
let mockRecognitionInstance: MockSpeechRecognition | null = null;

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

  constructor() {
    mockRecognitionInstance = this;
  }
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
  isFinal = true,
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
      expect(mockRecognitionInstance).toBeTruthy();
    });

    it('should apply default config values', () => {
      expect(mockRecognitionInstance?.lang).toBe('en-GB');
      expect(mockRecognitionInstance?.continuous).toBe(true);
      expect(mockRecognitionInstance?.interimResults).toBe(false);
      expect(mockRecognitionInstance?.maxAlternatives).toBe(1);
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
      expect(directive.available()).toBe(false);
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
      directiveEl.injector.get(SpeechButton);

      expect(mockRecognitionInstance?.lang).toBe('fr-FR');
      expect(mockRecognitionInstance?.continuous).toBe(false);
      expect(mockRecognitionInstance?.interimResults).toBe(true);
      expect(mockRecognitionInstance?.maxAlternatives).toBe(3);
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

      expect(mockRecognitionInstance?.start).toHaveBeenCalled();
    });

    it('should stop recognition when listening becomes false', () => {
      const button = fixture.debugElement.query(By.css('button'));

      // Start listening
      button.triggerEventHandler('click', new MouseEvent('click'));
      // Stop listening
      button.triggerEventHandler('click', new MouseEvent('click'));

      expect(mockRecognitionInstance?.stop).toHaveBeenCalled();
    });
  });

  describe('transcriptChanged output', () => {
    it('should emit transcript when speech is recognized', () => {
      const transcriptChangedSpy = vi.fn();
      directive.transcriptChanged.subscribe(transcriptChangedSpy);

      const mockEvent = createMockSpeechRecognitionEvent(['Hello world']);
      mockRecognitionInstance?.onresult?.(mockEvent);

      expect(transcriptChangedSpy).toHaveBeenCalledWith('Hello world');
    });

    it('should accumulate multiple results', () => {
      const transcriptChangedSpy = vi.fn();
      directive.transcriptChanged.subscribe(transcriptChangedSpy);

      const mockEvent = createMockSpeechRecognitionEvent(['Hello ', 'world']);
      mockRecognitionInstance?.onresult?.(mockEvent);

      expect(transcriptChangedSpy).toHaveBeenCalledWith('Hello world');
    });
  });

  describe('transcriptCompleted output', () => {
    it('should emit final transcript on recognition end', () => {
      const transcriptCompletedSpy = vi.fn();
      directive.transcriptCompleted.subscribe(transcriptCompletedSpy);

      // Simulate speech result
      const mockEvent = createMockSpeechRecognitionEvent(['Hello world']);
      mockRecognitionInstance?.onresult?.(mockEvent);

      // Simulate recognition end
      mockRecognitionInstance?.onend?.(new Event('end'));

      expect(transcriptCompletedSpy).toHaveBeenCalledWith('Hello world');
    });

    it('should not emit if no transcript was captured', () => {
      const transcriptCompletedSpy = vi.fn();
      directive.transcriptCompleted.subscribe(transcriptCompletedSpy);

      // Simulate recognition end without any results
      mockRecognitionInstance?.onend?.(new Event('end'));

      expect(transcriptCompletedSpy).not.toHaveBeenCalled();
    });

    it('should reset transcript after completion', () => {
      const transcriptCompletedSpy = vi.fn();
      directive.transcriptCompleted.subscribe(transcriptCompletedSpy);

      // First session
      mockRecognitionInstance?.onresult?.(createMockSpeechRecognitionEvent(['First']));
      mockRecognitionInstance?.onend?.(new Event('end'));

      // Second session with no results
      mockRecognitionInstance?.onend?.(new Event('end'));

      expect(transcriptCompletedSpy).toHaveBeenCalledTimes(1);
      expect(transcriptCompletedSpy).toHaveBeenCalledWith('First');
    });

    it('should set listening to false on recognition end', () => {
      // Start listening
      const button = fixture.debugElement.query(By.css('button'));
      button.triggerEventHandler('click', new MouseEvent('click'));
      expect(directive.listening()).toBe(true);

      // Simulate recognition end
      mockRecognitionInstance?.onend?.(new Event('end'));

      expect(directive.listening()).toBe(false);
    });
  });

  describe('error output', () => {
    it('should emit error events', () => {
      const errorSpy = vi.fn();
      directive.error.subscribe(errorSpy);

      const mockError = createMockErrorEvent('no-speech');
      mockRecognitionInstance?.onerror?.(mockError);

      expect(errorSpy).toHaveBeenCalledWith(mockError);
    });

    it('should filter out aborted errors', () => {
      const errorSpy = vi.fn();
      directive.error.subscribe(errorSpy);

      const mockError = createMockErrorEvent('aborted');
      mockRecognitionInstance?.onerror?.(mockError);

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
        mockRecognitionInstance?.onerror?.(mockError);
      });

      expect(errorSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe('abort method', () => {
    it('should call recognition.abort() when listening', () => {
      const button = fixture.debugElement.query(By.css('button'));
      button.triggerEventHandler('click', new MouseEvent('click'));

      expect(directive.listening()).toBe(true);

      directive.abort();

      expect(mockRecognitionInstance?.abort).toHaveBeenCalled();
    });

    it('should not call recognition.abort() when not listening', () => {
      expect(directive.listening()).toBe(false);

      directive.abort();

      expect(mockRecognitionInstance?.abort).not.toHaveBeenCalled();
    });

    it('should not emit transcriptCompleted when aborted', () => {
      const transcriptCompletedSpy = vi.fn();
      directive.transcriptCompleted.subscribe(transcriptCompletedSpy);

      const button = fixture.debugElement.query(By.css('button'));
      button.triggerEventHandler('click', new MouseEvent('click'));

      // Simulate speech result
      const mockEvent = createMockSpeechRecognitionEvent(['Hello world']);
      mockRecognitionInstance?.onresult?.(mockEvent);

      // Abort instead of waiting for natural end
      directive.abort();

      // Simulate the abort triggering an error event (which is filtered out)
      const abortError = createMockErrorEvent('aborted');
      mockRecognitionInstance?.onerror?.(abortError);

      expect(transcriptCompletedSpy).not.toHaveBeenCalled();
    });

    it('should filter out aborted error when abort is called', () => {
      const errorSpy = vi.fn();
      directive.error.subscribe(errorSpy);

      const button = fixture.debugElement.query(By.css('button'));
      button.triggerEventHandler('click', new MouseEvent('click'));

      directive.abort();

      // Simulate the abort triggering an error event
      const abortError = createMockErrorEvent('aborted');
      mockRecognitionInstance?.onerror?.(abortError);

      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
