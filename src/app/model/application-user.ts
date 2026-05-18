import { Signal, signal } from "@angular/core";
import { ValidationErrors } from "@angular/forms";
import { email, form, required, minLength, validate, debounce } from "@angular/forms/signals";

export interface ApplicationUser {
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    email: string;
    emailConfirmed?: boolean;
    phoneNumber: string;
    twoFactorEnabled?: boolean;
    lockoutEnd?: Date;
    lockoutEnabled?: boolean;
    accessFailedCount?: number;
    username: string;
    password: string;
    confirmPassword: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const initialUserValue: ApplicationUser = {
    firstName: "",
    lastName: "",
    fullName: "",
    role: "",
    email: "",
    emailConfirmed: false,
    phoneNumber: "",
    twoFactorEnabled: false,
    lockoutEnd: undefined,
    lockoutEnabled: false,
    accessFailedCount: 0,
    username: "",
    password: "",
    confirmPassword: "",
    createdAt: new Date(),
    updatedAt: new Date(),
};

const userDataSignal = signal<ApplicationUser>(initialUserValue);

export function createInitialUserSignal() {
    return signal<ApplicationUser>({ ...initialUserValue });
}

export function createApplicationUserForm() {
    const initialUserSignal = createInitialUserSignal();

    return form(initialUserSignal, (schema) => {
    required(schema.firstName, {message: "First Name is a required field"});
    required(schema.lastName,{message: "Last Name is a required field"});
    required(schema.role,{message: "Role is a required field"});
    debounce(schema.email, 300);
    required(schema.email,{message: "Email is a required field"});
    email(schema.email, {message: "Please enter a valid email address"});
    required(schema.phoneNumber,{message: "Phone Number is a required field"});
    required(schema.username,{message: "Username is a required field"});
      
    required(schema.confirmPassword,{message: "Confirm Password is a required field"});
    // Password validators
      required(schema.password, { message: "Password is a required field" });
      minLength(schema.password, 6, { message: "Password must be at least 6 characters long" });

      // Confirm password validators
      required(schema.confirmPassword, { message: "Confirm Password is a required field" });
      
       // FIX: Use the context object ({ value, valueOf }) provided by validate
        validate(schema.confirmPassword, ({ value, valueOf }) => {
            const currentConfirm = value(); // Value of the field being validated
            const passwordValue = valueOf(schema.password); // Value of the password field

            if (currentConfirm !== passwordValue) {
                return {
                    kind: "passwordMismatch",
                    message: "Passwords do not match"
                };
            }
            return null; // Return null if validation passes
    } );
})};