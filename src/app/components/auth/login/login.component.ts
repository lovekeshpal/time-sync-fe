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
import { STORAGE_KEYS } from '../../../constants/storage-keys.constants';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  isLoggingIn: boolean = false;
    loginError: string = ''; 

  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);

  private formValueChangesSubscription!: Subscription;

  /**
   * Initializes the login form with validation rules.
   */
  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      emailOrUsername: ['', Validators.required],
      password: [
        '',
        Validators.compose([
          Validators.required,
          Validators.maxLength(20),
          Validators.minLength(6),
        ]),
      ],
    });

        // Clear error messages when user starts typing
        this.formValueChangesSubscription = this.loginForm.valueChanges.subscribe(() => {
          if (this.loginError) {
            this.loginError = '';
          }
        });
  }

  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    if (this.formValueChangesSubscription) {
      this.formValueChangesSubscription.unsubscribe();
    }
  }

  /**
   * Handles form submission. If the form is valid, it logs the form values.
   * If the form is invalid, it marks all controls as touched to display validation errors.
   */
  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoggingIn = true; // Start loading animation
      const { emailOrUsername, password } = this.loginForm.value;
      this.authService.login(emailOrUsername, password).subscribe({
        next: async (response: any) => {
          console.log('Login successful', response);
          // Handle successful login
          if (response.token) {
            try {
              await this.localStorageService.setItem(
                STORAGE_KEYS.AUTH_TOKEN,
                response.token
              );
              this.router.navigate(['/dashboard']);
            } catch (error) {
              console.error('Failed to set token in local storage', error);
            }
          } else {
            console.error('Token is missing in the response');
          }
        },
        error: (err: any) => {
          console.error('Login failed', err);
          this.isLoggingIn = false;
          
          // Handle specific error codes
          if (err.error && err.error.code) {
            switch (err.error.code) {
              case 4:
              case 5:
                // Invalid credentials (wrong email or password)
                this.loginForm.get('emailOrUsername')?.setErrors({ invalidCredentials: true });
                this.loginForm.get('password')?.setErrors({ invalidCredentials: true });
                this.loginError = 'Invalid email/username or password';
                break;
              case 3:
              default:
                // Server error or other issues
                this.loginError = err.error.msg || 'An error occurred during login. Please try again.';
            }
          } else {
            this.loginError = 'Connection error. Please try again later.';
          }
        },
        complete: () => {
          this.isLoggingIn = false; // Stop loading animation
          console.log('Login process completed');
        },
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  /**
   * Recursively marks all controls in the form group as touched.
   * @param formGroup The form group to mark as touched.
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
