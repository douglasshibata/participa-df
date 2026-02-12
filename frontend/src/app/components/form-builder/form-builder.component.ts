import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, copyArrayItem } from '@angular/cdk/drag-drop';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormRendererComponent } from './form-renderer.component';

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [CommonModule, DragDropModule, ReactiveFormsModule, FormRendererComponent],
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.scss'
})
export class FormBuilderComponent {
  availableFields = [
    { type: 'text', label: 'Texto' },
    { type: 'number', label: 'Número' },
    { type: 'email', label: 'E-mail' }
  ];

  formFields: any[] = [];
  selectedField: any = null;
  configForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.configForm = this.fb.group({
      label: [''],
      placeholder: [''],
      bootstrapClass: ['col-md-12'],
      textColor: ['#000000'],
      backgroundColor: ['#ffffff']
    });

    this.configForm.valueChanges.subscribe(val => {
      if (this.selectedField) {
        this.selectedField.label = val.label;
        this.selectedField.placeholder = val.placeholder;
        this.selectedField.bootstrapClass = val.bootstrapClass;
        this.selectedField.customStyles = {
          color: val.textColor,
          backgroundColor: val.backgroundColor
        };
      }
    });
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.formFields, event.previousIndex, event.currentIndex);
    } else {
      const fieldType = event.previousContainer.data[event.previousIndex];
      const newField = {
        id: Date.now(),
        type: fieldType.type,
        label: `Novo ${fieldType.label}`,
        placeholder: `Digite o ${fieldType.label.toLowerCase()}...`,
        bootstrapClass: 'col-md-12',
        customStyles: { color: '#000000', backgroundColor: '#ffffff' },
        order: this.formFields.length
      };
      this.formFields.splice(event.currentIndex, 0, newField);
    }
    this.updateOrder();
  }

  updateOrder() {
    this.formFields.forEach((field, index) => {
      field.order = index;
    });
  }

  selectField(field: any) {
    this.selectedField = field;
    this.configForm.patchValue({
      label: field.label,
      placeholder: field.placeholder,
      bootstrapClass: field.bootstrapClass,
      textColor: field.customStyles?.color || '#000000',
      backgroundColor: field.customStyles?.backgroundColor || '#ffffff'
    }, { emitEvent: false });
  }

  get jsonOutput() {
    return JSON.stringify(this.formFields, null, 2);
  }
}
