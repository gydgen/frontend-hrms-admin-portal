import { Component } from '@angular/core';

@Component({
  selector: 'app-organization-settings',
  imports: [],
  templateUrl: './organization-settings.component.html',
  styleUrl: './organization-settings.component.scss',
  host: {
    class: 'form-page form-page--container',
  },
})
export class OrganizationSettingsComponent {
  readonly organizationName = 'Gydgen Ltd';
  readonly domain = 'gydgen';
}
