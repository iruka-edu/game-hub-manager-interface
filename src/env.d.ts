/// <reference types="astro/client" />

import type { User } from './models/User';
import type { Permission } from './auth/auth-rbac';

declare global {
  namespace App {
    interface Locals {
      user?: User;
      permissions?: Permission[];
    }
  }
}

export {};
