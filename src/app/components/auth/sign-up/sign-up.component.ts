import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../../services/local-storage/local-storage.service';
import { ROUTES, STORAGE_KEYS } from '../../../constants';

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

  isSigningUp: boolean = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);

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
      this.isSigningUp = true; // Start loading animation
      const { username, email, password } = this.signUpForm.value;
      this.authService.signup(username, email, password).subscribe({
        next: async (response: any) => {
          console.log('Sign-up successful', response);
          // Handle successful sign-up, e.g., navigate to dashboard
          if (response.token) {
            try {
              await this.localStorageService.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
              this.router.navigate([ROUTES.DASHBOARD]);
            } catch (error) {
              console.error('Failed to set token in local storage', error);
            }
          } else {
            console.error('Token is missing in the response');
          }
        },
        error: (err: any) => {
          console.error('Sign-up failed', err);
          // Handle sign-up error, e.g., show error message
          if (err.error.code && err.error.code === 1) {
            this.signUpForm
              .get('username')
              ?.setErrors({ usernameExists: true });
            this.isSigningUp = false;
          } else if (err.error.code && err.error.code === 2) {
            this.signUpForm.get('email')?.setErrors({ emailExists: true });
            this.isSigningUp = false;
          } else {
            this.signUpForm.get('password')?.setErrors({ serverError: true });
            this.isSigningUp = false;
          }
        },
        complete: () => {
          this.isSigningUp = false; // Stop loading animation
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
