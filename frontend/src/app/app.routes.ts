import { Routes } from '@angular/router';
import { ManifestationFormComponent } from './components/manifestation-form/manifestation-form.component';
import { ManifestationStatusComponent } from './components/manifestation-status/manifestation-status.component';
import { FormBuilderComponent } from './components/form-builder/form-builder.component';

export const routes: Routes = [
    { path: '', component: ManifestationFormComponent },
    { path: 'status', component: ManifestationStatusComponent },
    { path: 'builder', component: FormBuilderComponent },
    { path: '**', redirectTo: '' }
];
