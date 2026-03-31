import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button-create',
  imports: [CommonModule],
  template: `
    <button class="btn btn-create" [disabled]="disabled">
      <span> {{ label }} </span>
      @if (isLoading) {
        <span class="loader"></span>
      }
    </button>
  `,
  styles: [
    `
      button {
        padding: 10px 14px;
        width: 100%;
        text-align: center;
        font-weight: 600;
        font-size: 16px;
        line-height: 24px;
        color: #ffffff;
        background-color: #3b82f6;
        border-radius: 8px;
        border: 1px solid #3b82f6;
        box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
        transition:
          background-color 0.2s ease,
          transform 0.1s ease;
        &:hover {
          background-color: #2563eb;
          border: 1px solid #2563eb;
          color: #ffffff;
        }

        &:active {
          background-color: #1d4ed8 !important;
          box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.1);
        }

        &:disabled {
          background-color: #93c5fd;
          border-color: #93c5fd;
          color: #dbeafe;
          cursor: not-allowed;
          box-shadow: none;
        }

        .loader {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #fff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      }
    `,
  ],
})
export class ButtonCreateComponent {
  @Input() label!: string;
  @Input() isLoading: boolean = false;
  @Input() disabled: boolean = false;
}
