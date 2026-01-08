/// <reference types="dom-speech-recognition" />

import { Directive, Inject, input, OnInit, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { BehaviorSubject } from 'rxjs';
import { NgWindow, WINDOW } from '../ng-window/ng-window';

// https://blog.pamelafox.org/2024/12/add-browser-speech-inputoutput-to-your.html

/**
 * Configurable properties of the SpeechRecognition API.
 * Excludes methods and event handlers.
 */
export type SpeechRecognitionConfig = Partial<
  Pick<SpeechRecognition, 'lang' | 'continuous' | 'interimResults' | 'maxAlternatives' | 'grammars'>
>;

@Directive({
  selector: '[appSpeechButton]',
  exportAs: 'appSpeechButton',
  host: {
    '(click)': 'onClick($event)',
  },
})
export class SpeechButton implements OnInit {
  /**
   * The underlying SpeechRecognition instance for advanced usage.
   * Use this to attach custom event handlers or access additional API features.
   * Will be `null` if the Web Speech API is not available in the current browser.
   *
   * @example
   * ```typescript
   * @ViewChild('speech') speechButton!: SpeechButton;
   *
   * ngAfterViewInit() {
   *   this.speechButton.recognition?.addEventListener('soundstart', () => {
   *     console.log('Sound detected');
   *   });
   * }
   * ```
   */
  recognition: SpeechRecognition | null = null;

  /**
   * Configuration options for the SpeechRecognition API.
   * Override defaults by passing a partial config object.
   * See https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition for available options.
   *
   * @default { lang: navigator.language, interimResults: false, continuous: true, maxAlternatives: 1 }
   *
   * @example
   * ```html
   * <button appSpeechButton [config]="{ lang: 'en-US', continuous: false }">🎤</button>
   * ```
   */
  config = input<SpeechRecognitionConfig>({});

  /**
   * Indicates whether the Web Speech API is available in the current browser.
   * Use this to conditionally show/hide the speech button or display a fallback.
   *
   * @example
   * ```html
   * <button appSpeechButton #speech="appSpeechButton" [hidden]="!speech.available()">🎤</button>
   * ```
   */
  available = signal<boolean>(false);

  private listeningSubject = new BehaviorSubject<boolean>(false);
  private listening$ = this.listeningSubject.asObservable();

  /**
   * Indicates whether the speech recognition is currently active and listening.
   * Use this to update UI state (e.g., show a recording indicator).
   *
   * @example
   * ```html
   * <button appSpeechButton #speech="appSpeechButton">
   *   {{ speech.listening() ? '🔴 Listening...' : '🎤' }}
   * </button>
   * ```
   */
  listening = toSignal(this.listening$);

  /**
   * Emits the transcribed text from speech recognition.
   * The transcript is a concatenation of all speech results captured
   * during the current listening session.
   *
   * @example
   * ```html
   * <button appSpeechButton (transcriptReady)="onTranscript($event)">🎤</button>
   * ```
   */
  transcriptReady = output<string>();

  /**
   * Emits when a speech recognition error occurs.
   * The parent component can use this to display appropriate error messages.
   * Note: 'aborted' errors are filtered out and not emitted.
   *
   * @example
   * ```html
   * <button appSpeechButton (error)="onSpeechError($event)">🎤</button>
   * ```
   */
  error = output<SpeechRecognitionErrorEvent>();

  constructor(@Inject(WINDOW) private window: NgWindow) {}

  onClick(clickEvent: MouseEvent): void {
    this.listeningSubject.next(!this.listeningSubject.value);
  }

  ngOnInit(): void {
    if (this.window?.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      this.recognition = new SpeechRecognition();

      // Apply user config with defaults
      const userConfig = this.config();
      Object.assign(this.recognition, {
        lang: this.window.navigator.language,
        interimResults: false,
        continuous: true,
        maxAlternatives: 1,
        ...userConfig,
      });

      this.available.set(true);

      this.listening$.subscribe({
        next: (isListening) => {
          if (isListening) {
            this.recognition?.start();
          } else {
            this.recognition?.stop();
          }
        },
      });

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        this.transcriptReady.emit(transcript);
      };

      this.recognition.onend = (event: Event) => {
        this.listeningSubject.next(false);
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'aborted') {
          return;
        }

        this.error.emit(event);
      };
    }
  }
}
