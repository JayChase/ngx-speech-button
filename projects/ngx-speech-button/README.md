# ngx-speech-button

An Angular directive that provides an easy-to-use wrapper for the Web Speech API, enabling voice input functionality with minimal setup.

Add voice recognition to any button with:

- 🎤 **Click to listen** - Toggle speech recognition on/off
- 📝 **Real-time transcripts** - Get live updates as the user speaks
- ✅ **Final results** - Receive completed transcripts when speech ends
- ⚙️ **Configurable** - Customize language, continuous mode, and more
- 🔧 **Advanced access** - Direct access to the underlying SpeechRecognition instance

## TL;DR

Go straight to the demo on [StackBlitz](https://stackblitz.com/edit/ngx-speech-button-demo?file=app.html)

## Features

- Works on any clickable element (buttons, icons, etc.)
- Real-time transcript streaming
- Configurable speech recognition settings
- Exposes underlying SpeechRecognition API for advanced use cases
- SSR-safe with platform detection
- Standalone directive (no module required)
- Fully typed with TypeScript
- Lightweight with no dependencies

## Install

```bash
npm i -S ngx-speech-button && npm i -D @types/dom-speech-recognition
```

> **Note:** The `@types/dom-speech-recognition` package provides TypeScript types for the Web Speech API and is required as a dev dependency.

## Compatibility

| Angular Version | Package Version |
| --------------- | --------------- |
| 21.x            | ^1.0.0          |

## Browser Support

The Web Speech API is supported in modern browsers. Check [Can I Use](https://caniuse.com/speech-recognition) for current browser support.

## Usage

### Basic Usage

Add the `ngxSpeechButton` directive to any clickable element to enable voice input.

```typescript
import { Component } from '@angular/core';
import { SpeechButton } from 'ngx-speech-button';

@Component({
  selector: 'app-voice-input',
  imports: [SpeechButton],
  template: `
    <button ngxSpeechButton #speech="ngxSpeechButton" (transcriptCompleted)="onTranscript($event)">
      {{ speech.listening() ? '🔴 Listening...' : '🎤' }}
    </button>
    <p>Transcript: {{ transcript }}</p>
  `,
})
export class VoiceInputComponent {
  transcript = '';

  onTranscript(text: string) {
    this.transcript = text;
  }
}
```

### Real-time Streaming

Use `transcriptChanged` to receive updates as the user speaks:

```typescript
@Component({
  selector: 'app-live-transcription',
  imports: [SpeechButton],
  template: `
    <button
      ngxSpeechButton
      (transcriptChanged)="liveText = $event"
      (transcriptCompleted)="finalText = $event"
    >
      🎤 Speak
    </button>
    <p>Live: {{ liveText }}</p>
    <p>Final: {{ finalText }}</p>
  `,
})
export class LiveTranscriptionComponent {
  liveText = '';
  finalText = '';
}
```

### Custom Configuration

Configure the SpeechRecognition API with the `config` input:

```typescript
@Component({
  selector: 'app-custom-speech',
  imports: [SpeechButton],
  template: `
    <button
      ngxSpeechButton
      [config]="{ lang: 'en-US', continuous: false, interimResults: true }"
      (transcriptCompleted)="onComplete($event)"
    >
      🎤 English Only
    </button>
  `,
})
export class CustomSpeechComponent {
  onComplete(text: string) {
    console.log('Final:', text);
  }
}
```

### Error Handling

Handle speech recognition errors with the `error` output:

```typescript
@Component({
  selector: 'app-error-handling',
  imports: [SpeechButton],
  template: `
    <button ngxSpeechButton (transcriptCompleted)="onComplete($event)" (error)="onError($event)">
      🎤 Speak
    </button>
    @if (errorMessage) {
      <p class="error">{{ errorMessage }}</p>
    }
  `,
})
export class ErrorHandlingComponent {
  errorMessage = '';

  onComplete(text: string) {
    console.log(text);
  }

  onError(event: SpeechRecognitionErrorEvent) {
    this.errorMessage = `Error: ${event.error}`;
  }
}
```

### Advanced: Accessing the Recognition Instance

For advanced use cases, access the underlying `SpeechRecognition` instance:

```typescript
@Component({
  selector: 'app-advanced',
  imports: [SpeechButton],
  template: ` <button ngxSpeechButton #speech="ngxSpeechButton">🎤</button> `,
})
export class AdvancedComponent implements AfterViewInit {
  @ViewChild('speech') speechButton!: SpeechButton;

  ngAfterViewInit() {
    // Attach custom event handlers
    this.speechButton.recognition?.addEventListener('soundstart', () => {
      console.log('Sound detected');
    });

    this.speechButton.recognition?.addEventListener('speechstart', () => {
      console.log('Speech started');
    });
  }
}
```

### Conditional Display

Hide the button when the Web Speech API is not available:

```html
<button
  ngxSpeechButton
  #speech="ngxSpeechButton"
  [hidden]="!speech.available()"
  (transcriptCompleted)="onComplete($event)"
>
  🎤 Voice Input
</button>

@if (!speech.available()) {
<p>Voice input not supported in this browser</p>
}
```

## API Reference

### SpeechButton Directive

| Selector | `[ngxSpeechButton]` |
| -------- | ------------------- |

| Export As | `ngxSpeechButton` |
| --------- | ----------------- |

#### Inputs

| Name   | Type                      | Default | Description                                      |
| ------ | ------------------------- | ------- | ------------------------------------------------ |
| config | `SpeechRecognitionConfig` | `{}`    | Configuration options for SpeechRecognition API. |

#### Outputs

| Name                | Type                                        | Description                                       |
| ------------------- | ------------------------------------------- | ------------------------------------------------- |
| transcriptChanged   | `EventEmitter<string>`                      | Emits the current transcript as it updates.       |
| transcriptCompleted | `EventEmitter<string>`                      | Emits the final transcript when recognition ends. |
| error               | `EventEmitter<SpeechRecognitionErrorEvent>` | Emits when a speech recognition error occurs.     |

#### Properties

| Name        | Type                        | Description                                                 |
| ----------- | --------------------------- | ----------------------------------------------------------- |
| available   | `Signal<boolean>`           | Whether the Web Speech API is available.                    |
| listening   | `Signal<boolean>`           | Whether speech recognition is currently active.             |
| recognition | `SpeechRecognition \| null` | The underlying SpeechRecognition instance for advanced use. |

### SpeechRecognitionConfig Type

```typescript
type SpeechRecognitionConfig = Partial<
  Pick<SpeechRecognition, 'lang' | 'continuous' | 'interimResults' | 'maxAlternatives' | 'grammars'>
>;
```

| Property        | Type                | Default              | Description                                   |
| --------------- | ------------------- | -------------------- | --------------------------------------------- |
| lang            | `string`            | `navigator.language` | Language for recognition (e.g., 'en-US').     |
| continuous      | `boolean`           | `true`               | Whether to return continuous results.         |
| interimResults  | `boolean`           | `false`              | Whether to return interim results.            |
| maxAlternatives | `number`            | `1`                  | Maximum number of alternative transcriptions. |
| grammars        | `SpeechGrammarList` | -                    | Grammar list to constrain recognition.        |

## Requirements

- Angular 21+
- Browser with Web Speech API support

## Development

To clone this repo and run it locally:

```bash
git clone https://github.com/JayChase/ngx-speech-button.git
cd ngx-speech-button
npm install
npm run build
```

### Demo

```bash
ng serve demo
```

### Run tests

```bash
npm test
```

## License

MIT

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
