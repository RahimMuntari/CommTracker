import { Component, inject, linkedSignal, Signal, signal } from '@angular/core';
import { FormField, submit } from "@angular/forms/signals";
import { ApplicationUser, createApplicationUserForm, createInitialUserSignal } from '../model/application-user';
import { ApplicationUserService } from '../services/application-user-service';

@Component({
  selector: 'app-userregistration',
  imports: [FormField],
  templateUrl: './userregistration.html',
  styleUrls: ['./userregistration.css'],
})
export class Userregistration {

  private userService = inject(ApplicationUserService);
  private applicationUserService = inject(ApplicationUserService);
  readonly applicationUserForm = createApplicationUserForm();
  protected readonly applicationUserModel = linkedSignal(createInitialUserSignal());


  /**
   *
   */
  constructor() {
    
    const applicationUsers = signal<ApplicationUser[]>([]);

    console.log(this.applicationUserModel());
    this.applicationUserModel.update(currentUser => ({
      ...currentUser,
      role: 'User'
    }));
     
  }

  protected onKeyBoardDown(event: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Delete', 'Escape', 'Enter', 'Tab', 'ArrowLeft', 'ArrowRight'];
    if (!allowedKeys.includes(event.key) && !/^\d$/.test(event.key)) {
      //event.preventDefault();
    }
  }
  onSuccess: boolean = false;

 onSubmit() {
    event?.preventDefault();
    submit(this.applicationUserForm, async (formData) => {
      const user = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobileNo: formData.phoneNumber,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: formData.role,
      };

      const resultUserResource = this.applicationUserService.createApplicationUserResource(this.applicationUserModel);
      const resultUser = this.applicationUserService.createApplicationUser(this.applicationUserModel());

      console.log('User Data:', user);
      this.onSuccess = true;

      //return resultUser;
    });
  }

  resetForm() {
    this.applicationUserForm().reset({
      firstName: '',
      lastName: '',
      fullName: '',
      role: '',
      email: '',
      phoneNumber: '',
      username: '',
      password: '',
      confirmPassword: '',
    });
  }
}
