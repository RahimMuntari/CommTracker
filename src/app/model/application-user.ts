import { HttpClient } from "@angular/common/http";
import { inject, resource, Signal, signal } from "@angular/core";
import { ValidationErrors } from "@angular/forms";
import { email, form, required, minLength, validate, debounce, validateAsync } from "@angular/forms/signals";
import { ApplicationUserService } from "../services/application-user-service";
import { firstValueFrom } from "rxjs";
import { rxResource } from "@angular/core/rxjs-interop";



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
    role: "Admin",
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

    const http = inject(HttpClient);
    const applicationUserService = inject(ApplicationUserService);
    
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
        minLength(schema.username, 5, {message: "Username must be at least 5 characters long"});

        // --- Asynchronous Validation (Database Check) ---
        debounce(schema.username, 400);
        validateAsync<string, string | undefined,  boolean>(schema.username, {
        // 1. Only run network checks if sync validators pass and entry has length
        params: ({ value }) => {
            const val = value();
            return val && val.trim().length >= 5 ? val.trim() : undefined;
        },

        // 2. Construct an RxJS-backed resource using the underlying form string parameter
        factory: (params: Signal<string | undefined>) => rxResource({
            params,            
            stream: ({ params }) => applicationUserService.checkUserNameAvailability(params)
        }),

        // 3. Map the HTTP response boolean result directly to Form state
        // If true (Taken) -> Return the validation error object
        // If false (Free) -> Return null (Valid)
        onSuccess: (isTaken) => {
            return isTaken 
            ? { kind: "usernameTaken", message: "Username is already taken" } 
            : null;
        },

            // Fallback object state if network/gateway disconnect occurs
            onError: () => ({ kind: "validationFailed", message: "Unable to verify username availability" })
        });
        // Password validators
        required(schema.password, { message: "Password is a required field, " });
        minLength(schema.password, 6, { message: "Password must be at least 6 characters long, " });

        // required(schema.password, { message: "Password is a required field" });
        validate(schema.password, ({ value }) => {
            const password = value();
            const errors: string[] = [];

            // 1. PasswordRequiresDigit
            if (!/\d/.test(password)) {
                errors.push('PasswordRequiresDigit');
            }

            // 2. PasswordRequiresUpper
            if (!/[A-Z]/.test(password)) {
                errors.push('PasswordRequiresUpper');
            }

            // 3. PasswordRequiresLower
            if (!/[a-z]/.test(password)) {
                errors.push('PasswordRequiresLower');
            }

            // 4. PasswordRequiresNonAlphanumeric
            if (!/[^a-zA-Z0-9]/.test(password)) {
                errors.push('PasswordRequiresNonAlphanumeric');
            }

            // Directly return the error object shape instead of customError()
            if (errors.length > 0) {

                const friendlyNames: Record<string, string> = {
                    PasswordRequiresDigit: 'at least one number',
                    PasswordRequiresUpper: 'an uppercase letter',
                    PasswordRequiresLower: 'a lowercase letter',
                    PasswordRequiresNonAlphanumeric: 'a special character'
                };

                const formattedErrors = errors
                    .map(error => friendlyNames[error] || error)
                    .join(', ');

                return {
                    kind: 'password-strength',
                    message: 'Password must include: ' + formattedErrors,
                    details: errors
                };

                 // Converts "PasswordRequiresDigit" to "Password Requires Digit"
                // const formattedErrors = errors
                //     .map(error => error.replace(/([A-Z])/g, ' $1').trim())
                //     .join(', ');

                // return {
                //     kind: 'password-strength',
                //     message: 'Password does not meet requirements: ' + formattedErrors,
                //     details: errors
                // };


                // return {
                // kind: 'password-strength',
                // message: 'Password does not meet requirements.: ' + errors.join(', '),
                // details: errors
                // };
            }

            return undefined; 
        });

        // Confirm password validators
        required(schema.confirmPassword, { message: "Confirm Password is a required field, " });
        
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
    })
};