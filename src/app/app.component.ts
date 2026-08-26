import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToastrComponent } from './shared/toastr/toastr.component';
import { GeneralLoaderComponent } from './shared/general-loader/general-loader.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastrComponent, GeneralLoaderComponent, ConfirmDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);
  protected readonly title = signal('HRMS');

  showLoader = signal(false);
  showLoaderEffects = effect(() => {
    console.log('Loader state changed:', this.showLoader());
    this.router.events.subscribe((event) => {
      if (event.constructor.name === 'NavigationStart') {
        this.showLoader.set(true);
      } else if (event.constructor.name === 'NavigationEnd') {
        this.showLoader.set(false);
      }else{
        this.showLoader.set(false); // Ensure loader is hidden for any other navigation events
      }
    });
  });
}
