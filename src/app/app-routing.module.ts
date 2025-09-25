import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';

const routes: Routes = [
  {
    path: 'generate-checklist',
    component: ChatComponent,
    data: {
      initialPrompt:
        'Generate Quality control checklist items for Equipment provided its subcategory is monitor and sub sub categories are 43 inches, LCD, 4k and HD. Please format checklist as a single-level hierarchy with headings followed by checklist items text details in simple. No multi-tier hierarchical bullets points, just 1 level hirarchy for section heading. 1 level bullet points after section heading and each point should only start with *.',
    },
  },
  { path: '', redirectTo: 'generate-checklist', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
