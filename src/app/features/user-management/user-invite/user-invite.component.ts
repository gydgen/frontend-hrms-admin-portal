import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-invite',
  imports: [RouterLink],
  templateUrl: './user-invite.component.html',
  styleUrl: './user-invite.component.scss',
  host: {
    class: 'form-page form-page--container',
  },
})
export class UserInviteComponent {}
