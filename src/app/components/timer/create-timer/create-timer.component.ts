import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Custom validator to ensure at least one duration field has a value > 0
const durationRequiredValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const days = control.get('days')?.value || 0;
  const hours = control.get('hours')?.value || 0;
  const minutes = control.get('minutes')?.value || 0;
  const seconds = control.get('seconds')?.value || 0;

  return days === 0 && hours === 0 && minutes === 0 && seconds === 0
    ? { durationRequired: true }
    : null;
};

@Component({
  selector: 'app-create-timer',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './create-timer.component.html',
  styleUrl: './create-timer.component.scss',
})
export class CreateTimerComponent {
  timerForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    // Create form with duration fields
    this.timerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(50)]],
        description: ['', [Validators.maxLength(200)]],
        days: [
          0,
          [Validators.required, Validators.min(0), Validators.max(365)],
        ],
        hours: [
          0,
          [Validators.required, Validators.min(0), Validators.max(23)],
        ],
        minutes: [
          5,
          [Validators.required, Validators.min(0), Validators.max(59)],
        ],
        seconds: [
          0,
          [Validators.required, Validators.min(0), Validators.max(59)],
        ],
        isPublic: [true],
        showMilliseconds: [true],
        theme: ['default'],
      },
      { validators: durationRequiredValidator }
    );
  }

  // Getter for easy access to form fields
  get f() {
    return this.timerForm.controls;
  }

  onSubmit(): void {
    if (this.timerForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formData = this.timerForm.value;

    // Convert all duration values to seconds
    const totalDurationInSeconds =
      formData.days * 24 * 60 * 60 + // Days to seconds
      formData.hours * 60 * 60 + // Hours to seconds
      formData.minutes * 60 + // Minutes to seconds
      formData.seconds; // Seconds

    // Prepare data for API to match the backend schema
    const timerData = {
      name: formData.name,
      description: formData.description,
      duration: totalDurationInSeconds,
      isPublic: formData.isPublic,
      showMilliseconds: formData.showMilliseconds,
      theme: formData.theme,
    };

    // Call your timer service to create the timer
    // Replace this with actual API call
    setTimeout(() => {
      console.log('Timer data to be sent to API:', timerData);
      this.isSubmitting = false;

      // Navigate to the timer view or dashboard
      this.router.navigate(['/dashboard']);
    }, 1000);
  }
}
