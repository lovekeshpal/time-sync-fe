import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, MinValidator, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;

  private formBuilder = inject(FormBuilder);

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
      console.log('Form Submitted', this.loginForm.value);
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
