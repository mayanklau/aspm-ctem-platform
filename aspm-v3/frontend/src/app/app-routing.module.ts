import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'app-posture', pathMatch: 'full' },
  { path: 'app-posture', loadChildren: () => import('./app-posture/app-posture.module').then(m => m.AppPostureModule) }
];

@NgModule({ imports: [RouterModule.forRoot(routes)], exports: [RouterModule] })
export class AppRoutingModule {}
