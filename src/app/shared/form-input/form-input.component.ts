import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  signal,
  Signal,
  ViewChildren,
  WritableSignal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-form-input',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatCheckboxModule,
    MultiSelectModule,
  ],
  templateUrl: './form-input.component.html',
  styleUrl: './form-input.component.scss',
})
export class FormInputComponent {
  @Input() label!: string;
  @Input({ required: true }) name!: string;
  @Input() type!: string;
  @Input() placeholder!: string;
  @Input() title!: string;
  @Input() formGroup: FormGroup = new FormGroup({});
  @Input() isSelect = false;
  @Input() isOption = false;
  @Input() isCheckbox = false;
  @Input() visible = false;

  @Input() isMultiSelect = false;
  @Input() isRequired = false;
  @Input() checks!: any;
  @Input() selections: any[] = [];
  @Input() options!: Signal<any[]>;

  otpArray = new Array(4).fill('');
  otp: string[] = new Array(4).fill('');
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;
  @Output() otpChange = new EventEmitter<string>();

  selectedOption: WritableSignal<string> = signal('');
  open = true;
  visibility() {
    this.open = !this.open;
  }
  onChange(event: Event) {
    this.selectedOption.set((event.target as HTMLSelectElement).value);
  }

  onInput(event: any, index: number) {
    const input = event.target;
    const value = input.value.replace(/\D/g, '');

    if (value) {
      this.otp[index] = value;
      this.emitOtp();
      if (index < this.otpInputs.length - 1) {
        this.otpInputs.get(index + 1)?.nativeElement.focus();
      }
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      if (this.otp[index]) {
        this.otp[index] = '';
      } else if (index > 0) {
        this.otpInputs.get(index - 1)?.nativeElement.focus();
        this.otp[index - 1] = '';
      }
      this.emitOtp();
    }
  }
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text') || '';
    const digits = pasteData.replace(/\D/g, '').split('');

    if (digits.length >= this.otpInputs.length) {
      this.otp = digits.slice(0, this.otpInputs.length);
      setTimeout(() => {
        this.otpInputs.last?.nativeElement.focus();
      });
    }
  }

  emitOtp() {
    this.otpChange.emit(this.otp.join(''));
  }
}
