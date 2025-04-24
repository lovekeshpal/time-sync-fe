import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TimerService } from '../../../services/timer/timer.service';

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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private timerService: TimerService
  ) {}

  ngOnInit(): void {
    // Initialize form with duration fields
    this.timerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      days: [0, [Validators.required, Validators.min(0), Validators.max(365)]],
      hours: [0, [Validators.required, Validators.min(0), Validators.max(23)]],
      minutes: [
        5,
        [Validators.required, Validators.min(0), Validators.max(59)],
      ],
      seconds: [
        0,
        [Validators.required, Validators.min(0), Validators.max(59)],
      ],
      isPublic: [false],
      showMilliseconds: [true],
      theme: ['default'],
    });
  }

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
      formData.days * 24 * 60 * 60 +
      formData.hours * 60 * 60 +
      formData.minutes * 60 +
      formData.seconds;

    // Prepare data for API
    const timerData = {
      name: formData.name,
      description: formData.description,
      duration: totalDurationInSeconds,
      isPublic: formData.isPublic,
      showMilliseconds: formData.showMilliseconds,
      theme: formData.theme,
    };

    this.timerService.createTimer(timerData).subscribe({
      next: (response) => {
        console.log('Timer created successfully:', response);
        this.isSubmitting = false;
        this.router.navigate(['/timers']);
      },
      error: (error) => {
        console.error('Error creating timer:', error);
        this.errorMessage =
          error.message || 'Failed to create timer. Please try again.';
        this.isSubmitting = false;
      },
    });
  }
}
