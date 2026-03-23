import { Component, inject } from '@angular/core';
import { ToastrService } from './toastr.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type Type = 'success' | 'error';
export interface Alert {
  type: Type;
  message: string;
}

@Component({
  selector: 'app-toastr',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './toastr.component.html',
  styleUrl: './toastr.component.scss',
})
export class ToastrComponent {
  private toastrService = inject(ToastrService);
  public toastr$!: Observable<Alert>;

  ngOnInit(): void {
    this.toastr$ = this.toastrService.toastr;
  }
  onClose() {
    this.toastrService.IsDone();
  }
}
