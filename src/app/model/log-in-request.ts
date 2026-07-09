import { signal } from "@angular/core";
import { form, required } from "@angular/forms/signals";

export interface LogInRequest {
  userName: string;
  password: string; 
}

const initialLogInRequestValue: LogInRequest = {
  userName: "",
  password: "",
};  

const logInRequestSignal = signal<LogInRequest>(initialLogInRequestValue);

export function createInitialLogInRequestSignal() {
  return signal<LogInRequest>({ ...initialLogInRequestValue });
}   

export function createLogInRequestForm() {
  const initialLogInRequestSignal = createInitialLogInRequestSignal(); 
    return form(initialLogInRequestSignal, (schema) => {
        required(schema.userName, {message: "Username is a required field"});
        required(schema.password, {message: "Password is a required field"});
    });
}