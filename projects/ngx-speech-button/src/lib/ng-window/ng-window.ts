/// <reference types="dom-speech-recognition" />

import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';

export type NgWindow = Window & {
  webkitSpeechRecognition: SpeechRecognition;
};

export const WINDOW = new InjectionToken<NgWindow | null>('window with webkitSpeechRecognition', {
  factory: () =>
    isPlatformBrowser(inject(PLATFORM_ID))
      ? (inject(DOCUMENT).defaultView as unknown as NgWindow)
      : null,
});
