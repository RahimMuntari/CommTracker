import { signal } from "@angular/core";
import { form, required } from "@angular/forms/signals";

export interface LogInResponse {
    token: string;
    refreshToken: string;
    expiresIn: number;
    userId: string;
    userName: string;
    role: string;   
    fullName?: string; // Optional property for full name   
}

const initialLogInResponseValue: LogInResponse = {
    token: "",
    refreshToken: "",
    expiresIn: 0,
    userId: "",
    userName: "",
    role: " ",
    fullName: "", // Initialize optional fullName property  
};  

const logInResponseSignal = signal<LogInResponse>(initialLogInResponseValue);

export function createInitialLogInResponseSignal() {
  return signal<LogInResponse>({ ...initialLogInResponseValue });
}   

export function createLogInResponseForm() {
  const initialLogInResponseSignal = createInitialLogInResponseSignal(); 
    return form(initialLogInResponseSignal, (schema) => {
        required(schema.userName, {message: "Username is a required field"});
        required(schema.token, {message: "Token is a required field"});
    });
}