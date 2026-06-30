// features/cooperative/agents/agents.routes.ts
//
// Agent management routes, mounted at /cooperative/agents.
// The parent route in cooperative.routes.ts already applies permissionGuard
// for the module; per-screen actions are tagged individually here.

import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/guards/permission.guard';

export const AGENTS_ROUTES: Routes = [

  // Agent list — /cooperative/agents
  {
    path: '',
    loadComponent: () =>
      import('./agents-list/agents-list.component')
        .then(m => m.AgentsListComponent),
  },

  // Register agent — /cooperative/agents/register
  {
    path: 'register',
    canActivate: [permissionGuard],
    data: { permissions: ['agents.register'], title: 'Register Agent', subtitle: 'Add a new field agent to your cooperative' },
    loadComponent: () =>
      import('./agent-form/agent-form.component')
        .then(m => m.AgentFormComponent),
  },

  // Edit agent — /cooperative/agents/:id/edit
  {
    path: ':id/edit',
    canActivate: [permissionGuard],
    data: { permissions: ['agents.edit'], title: 'Edit Agent' },
    loadComponent: () =>
      import('./agent-form/agent-form.component')
        .then(m => m.AgentFormComponent),
  },
];
