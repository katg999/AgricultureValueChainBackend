# UGAAP Platform

> **Uganda Agrarian Portal** - Digital platform for agricultural management and operations

---

## Table of Contents

- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Naming Conventions](#-naming-conventions)
- [Shared Components](#-shared-components)
- [Design System](#-design-system)
- [Development Workflow](#-development-workflow)

---

## Getting Started

### Prerequisites

```bash
Node.js: 18.x or higher
npm: 9.x or higher
Angular CLI: 18.x or higher
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ugaap-platform

# Install dependencies
npm install

# Run development server
ng serve

# Open browser
http://localhost:4200
```

### Build Commands

```bash
# Development build
ng build

# Production build
ng build --configuration production

# Run tests
ng test

# Run linter
ng lint
```

---

## Project Structure

```
ugaap-platform/
├── src/
│   ├── app/
│   │   ├── core/                      # Singleton services, guards, interceptors
│   │   │   ├── services/              # Auth, API, state management
│   │   │   ├── guards/                # Route guards (auth, role)
│   │   │   └── interceptors/          # HTTP interceptors
│   │   │
│   │   ├── shared/                    # Shared/reusable code
│   │   │   ├── components/            # Reusable UI components
│   │   │   ├── directives/            # Custom directives
│   │   │   ├── pipes/                 # Custom pipes
│   │   │   └── models/                # Interfaces, types, models
│   │   │
│   │   ├── features/                  # Feature modules
│   │   │   ├── auth/                  # Authentication
│   │   │   ├── dashboard/             # Dashboard
│   │   │   ├── inventory/             # Inventory management
│   │   │   ├── operations/            # Operations
│   │   │   └── [other-features]/      # Additional features
│   │   │
│   │   ├── app.component.ts           # Root component
│   │   ├── app.routes.ts              # App routing
│   │   └── app.config.ts              # App configuration
│   │
│   ├── assets/                        # Static files
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── styles/                        # Global styles
│   │   └── styles.scss                # Main stylesheet with design tokens
│   │
│   └── environments/                  # Environment configs
│       ├── environment.ts
│       └── environment.prod.ts
│
├── angular.json                       # Angular CLI config
├── package.json                       # Dependencies
├── tsconfig.json                      # TypeScript config
└── README.md                          # This file
```

### Feature Module Structure

Each feature follows this pattern:

```
features/[feature-name]/
├── components/                        # Feature-specific components
├── services/                          # Feature-specific services
├── models/                            # Feature-specific models
├── [feature-name].routes.ts           # Feature routing
└── [feature-name].component.ts        # Feature entry component
```

---

## Naming Conventions

### Files

```
component-name.component.ts            # Component logic
component-name.component.html          # Component template
component-name.component.css           # Component styles
component-name.component.spec.ts       # Component tests

service-name.service.ts                # Service
pipe-name.pipe.ts                      # Pipe
directive-name.directive.ts            # Directive
guard-name.guard.ts                    # Guard
model-name.model.ts                    # Model/Interface
```

### Folders

```
kebab-case                             # All folders use kebab-case
feature-name/                          # Feature modules
component-name/                        # Component folders
```

### Components

```typescript
// PascalCase for class names
export class UserProfileComponent { }

// kebab-case for selectors
@Component({
  selector: 'app-user-profile'
})
```

### Variables & Functions

```typescript
// camelCase for variables and functions
const userName = 'John';
function getUserData() { }

// UPPERCASE for constants
const API_URL = 'https://api.ugaap.ug';
const MAX_ATTEMPTS = 5;
```

### Interfaces & Types

```typescript
// PascalCase with descriptive names
interface User { }
type UserRole = 'admin' | 'user';

// Prefix interfaces with 'I' (optional)
interface IUserProfile { }
```

---

## Shared Components

### Available Components

All shared components are located in `src/app/shared/components/`

#### 1. Button Component

**Location:** `shared/components/button/`

```html
<app-button 
  variant="primary"
  size="lg"
  [fullWidth]="true"
  [loading]="isLoading"
  (clicked)="onSubmit()">
  Submit
</app-button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'ghost' | 'danger' | 'warning'`
- `size`: `'sm' | 'md' | 'lg'`
- `fullWidth`: `boolean`
- `loading`: `boolean`
- `disabled`: `boolean`
- `iconLeft`: `string`
- `iconRight`: `string`

---

#### 2. Input Component

**Location:** `shared/components/input/`

```html
<app-input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  formControlName="email"
  [required]="true"
  [error]="emailError">
</app-input>
```

**Props:**
- `label`: `string`
- `type`: `'text' | 'email' | 'password' | 'number' | 'tel' | 'date'`
- `placeholder`: `string`
- `error`: `string`
- `hint`: `string`
- `required`: `boolean`
- `disabled`: `boolean`

---

#### 3. Spinner Component

**Location:** `shared/components/spinner/`

```html
<app-spinner size="md" color="orange"></app-spinner>
```

**Props:**
- `size`: `'sm' | 'md' | 'lg'`
- `color`: `'white' | 'orange' | 'grey'`

---

#### 4. Logo Component

**Location:** `shared/components/logo/`

```html
<app-logo size="md" [showSubtitle]="true"></app-logo>
```

**Props:**
- `size`: `'sm' | 'md' | 'lg'`
- `showSubtitle`: `boolean`

---

#### 5. Alert Component

**Location:** `shared/components/alert/`

```html
<app-alert 
  variant="error" 
  [message]="errorMessage"
  *ngIf="errorMessage">
</app-alert>
```

**Props:**
- `variant`: `'error' | 'warning' | 'info' | 'success'`
- `message`: `string`
- `showIcon`: `boolean`

---

## Design System

### Design Tokens

All colors, fonts, and spacing are defined in `src/styles.scss`

#### Colors

```css
:root {
  /* Brand Colors */
  --primary: #F25D27;              /* Orange - Primary actions */
  --primary-container: #CF450D;     /* Darker Orange - Hover states */
  --secondary: #200B26;             /* Deep Plum - Text */
  --muted-purple: #533C59;          /* Muted Purple - Secondary text */
  
  /* Surfaces */
  --surface-low: #F4F3F5;           /* Page backgrounds */
  --surface-lowest: #FFFFFF;        /* Cards, elevated elements */
  --surface-highest: #EBE9ED;       /* Input backgrounds */
  
  /* Typography */
  --font-human: 'Inter', sans-serif;
  --font-technical: 'IBM Plex Mono', monospace;
}
```

#### Usage

```css
/* DO: Use design tokens */
.button {
  background: var(--primary);
  color: white;
  font-family: var(--font-human);
}

/* DON'T: Hardcode colors */
.button {
  background: #F25D27;
  color: #fff;
  font-family: 'Inter';
}
```

### Typography

```css
/* Headings - Use Inter (--font-human) */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-human);
}

/* Body text - Use Inter */
body, p, span {
  font-family: var(--font-human);
}

/* Technical data - Use IBM Plex Mono */
.code, .id, .timestamp {
  font-family: var(--font-technical);
}
```

### Spacing Scale

Use consistent spacing values:

```css
/* Standard spacing scale */
4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px

/* Examples */
padding: 16px;
margin-bottom: 24px;
gap: 12px;
```

### Shadows (Elevation)

```css
/* Low elevation */
box-shadow: 0 1px 3px rgba(32, 11, 38, 0.04);

/* Medium elevation */
box-shadow: 0 2px 8px rgba(32, 11, 38, 0.06);

/* High elevation */
box-shadow: 0 4px 16px rgba(32, 11, 38, 0.08);
```


## Development Workflow

### Creating a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/feature-name

# 2. Generate feature component
ng generate component features/feature-name --standalone

# 3. Build your feature

# 4. Test locally
ng serve

# 5. Commit changes
git add .
git commit -m "feat: Add feature-name"

# 6. Push to remote
git push -u origin feature/feature-name

# 7. Create Pull Request
```

### Creating a New Component

```bash
# Shared component
ng generate component shared/components/component-name --standalone

# Feature-specific component
ng generate component features/feature-name/components/component-name --standalone
```

### Creating a Service

```bash
# Core service (singleton)
ng generate service core/services/service-name

# Feature service
ng generate service features/feature-name/services/service-name
```


## Importing Components

### Shared Components

```typescript
import { ButtonComponent } from '@/shared/components/button/button.component';
import { InputComponent } from '@/shared/components/input/input.component';
import { LogoComponent } from '@/shared/components/logo/logo.component';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    LogoComponent
  ],
  // ...
})
```

### Using in Templates

```html
<div class="page">
  <app-logo size="md"></app-logo>
  
  <form [formGroup]="myForm">
    <app-input
      label="Email"
      formControlName="email">
    </app-input>
    
    <app-button
      variant="primary"
      [loading]="isLoading"
      (clicked)="onSubmit()">
      Submit
    </app-button>
  </form>
</div>
```

---

## Testing

```bash
# Run unit tests
ng test

# Run tests with coverage
ng test --code-coverage

# Run e2e tests
ng e2e
```

---

## Additional Resources

### Project Documentation

- `docs/REUSABLE_COMPONENTS_PACKAGE.md` - Detailed component usage
- `docs/COMPLETE_REFACTORING_SUMMARY.md` - Refactoring details

### External Links

- [Angular Documentation](https://angular.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [RxJS Documentation](https://rxjs.dev)

---

## Contributing

1. Create a feature branch from `dev`
2. Make your changes
3. Ensure all tests pass
4. Follow the code style guidelines
5. Commit with conventional commit messages
6. Push and create a Pull Request 
7. Request code review from atleast 3 people from the group

---

## upport

For questions or issues:
- Check existing documentation
- Review component source code
- Ask Someone 







**Built with by the Logic Lords Team**