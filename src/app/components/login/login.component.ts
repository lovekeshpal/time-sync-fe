import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, MinValidator, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { HttpClientModule } from "@angular/common/http";

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;

  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
 * Initializes the login form with validation rules.
 */
  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      emailOrUsername: ['', Validators.required],
      password: ['', Validators.compose([Validators.required, Validators.maxLength(20), Validators.minLength(6)])]
    })
  }

  /**
 * Handles form submission. If the form is valid, it logs the form values.
 * If the form is invalid, it marks all controls as touched to display validation errors.
 */
  onSubmit() {
    if (this.loginForm.valid) {
      const { emailOrUsername, password } = this.loginForm.value;
      this.authService.login(emailOrUsername, password).subscribe({
        next: (response: any) => {
          console.log('Login successful', response);
          // Handle successful login, e.g., navigate to dashboard
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => {
          console.error('Login failed', err);
          // Handle login error, e.g., show error message
        },
        complete: () => {
          console.log('Login process completed');
        }
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
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
