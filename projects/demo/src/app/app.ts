/// <reference types="dom-speech-recognition" />

import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SpeechButton } from 'ngx-speech-button';

@Component({
  selector: 'app-root',
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    SpeechButton,
    MatTooltipModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private matSnackBar = inject(MatSnackBar);

  protected formGroup = new FormGroup({
    prompt: new FormControl<string | null>(null, {
      validators: [],
    }),
  });

  protected transcript = signal<string>('');

  updateForm(transcription: string) {
    this.formGroup.controls.prompt.setValue(transcription);
  }

  updateTranscript(transcription: string) {
    this.transcript.set(transcription);
  }

  onError(error: SpeechRecognitionErrorEvent) {
    this.matSnackBar.open(error.message, 'Ok', {
      duration: 2000,
    });
  }
}
