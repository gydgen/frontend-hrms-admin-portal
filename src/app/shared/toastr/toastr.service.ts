import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Alert, Type } from './toastr.component';

@Injectable({
  providedIn: 'root',
})
export class ToastrService {
  private toastrSubject = new Subject<Alert>();
  private toastrObservable = this.toastrSubject.asObservable();
  public isLoading = signal(false);

  get toastr() {
    return this.toastrObservable;
  }

  triggerToastr(type: Type, message: string, delay = 4000): void {
    this.toastrSubject.next({ type, message });
    setTimeout(() => {
      this.toastrSubject.next({ type, message: '' });
    }, delay);
  }

  public IsLoading() {
    this.isLoading.set(true);
  }

  public IsDone() {
    this.isLoading.set(false);
  }
}
