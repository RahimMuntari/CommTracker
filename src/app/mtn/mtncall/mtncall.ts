import { Component, computed, signal } from '@angular/core';
import { initialData, MtnCall, mtnCallSchema } from '../../model/mtn-call';
import { form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'app-mtncall',
  imports: [],
  templateUrl: './mtncall.html',
  styleUrl: './mtncall.css',
})
export class Mtncall { 

 mtnCallModel= signal<MtnCall>(initialData);

 fullName = computed(() => (this.mtnCallModel().callingNo + '' + this.mtnCallModel().calledNo));

 mtnCallForm = form(this.mtnCallModel, mtnCallSchema);
 
}
