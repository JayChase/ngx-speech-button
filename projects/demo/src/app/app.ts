/// <reference types="dom-speech-recognition" />

import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private matSnackBar = inject(MatSnackBar);

  formGroup = new FormGroup({
    prompt: new FormControl<string | null>(null, {
      validators: [],
    }),
  });

  write(transcription: string) {
    this.formGroup.controls.prompt.setValue(transcription);
  }

  onError(error: SpeechRecognitionErrorEvent) {
    this.matSnackBar.open(error.message, 'Ok', {
      duration: 2000,
    });
  }
}
