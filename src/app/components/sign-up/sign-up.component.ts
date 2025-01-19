import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';

/**
 * SignUpComponent is responsible for handling the sign-up form functionality.
 * It initializes the form with validation rules and handles form submission.
 */
@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss',
})
export class SignUpComponent implements OnInit {
  /**
   * The FormGroup instance for the sign-up form.
   */
  signUpForm!: FormGroup;

  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * The FormBuilder instance used to create the form controls.
   */
  private formBuilder = inject(FormBuilder);

  /**
   * Initializes the sign-up form with validation rules.
   */
  ngOnInit(): void {
    this.signUpForm = this.formBuilder.group({
      username: [
        '',
        Validators.compose([
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20),
        ]),
      ],
      email: ['', Validators.compose([Validators.required, Validators.email])],
      password: [
        '',
        Validators.compose([
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(20),
        ]),
      ],
    });
  }

  /**
   * Handles the form submission. If the form is valid, it logs the form values.
   * Otherwise, it marks all form controls as touched to display validation errors.
   */
  onSubmit() {
    if (this.signUpForm.valid) {
      const { username, email, password } = this.signUpForm.value;
      this.authService.signup(username, email, password).subscribe({
        next: (response: any) => {
          console.log('Sign-up successful', response);
          // Handle successful sign-up, e.g., navigate to login page
          this.router.navigate(['/login']);
        },
        error: (err: any) => {
          console.error('Sign-up failed', err);
          // Handle sign-up error, e.g., show error message
        },
        complete: () => {
          console.log('Sign-up process completed');
        },
      });
    } else {
      this.markFormGroupTouched(this.signUpForm);
    }
  }

  /**
   * Recursively marks all controls in a FormGroup as touched.
   * This is used to trigger validation messages for all controls.
   *
   * @param formGroup - The FormGroup to mark as touched.
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
