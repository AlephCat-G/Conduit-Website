import { Route } from '@angular/router';
import { RosterComponent } from './roster.component';

export const ROSTER_ROUTES: Route[] = [
  {
    path: '',
    component: RosterComponent
 // Add this to mark the component as standalone in the route
  },
];