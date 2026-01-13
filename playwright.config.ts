import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Responsive Testing
 * 
 * Supports testing across Desktop, Tablet, and Mobile breakpoints
 * with property-based testing for responsive behavior validation.
 */
export default defineConfig({
  testDir: './test/responsive',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    // Desktop Testing (≥1200px)
    {
      name: 'desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1200, height: 800 }
      },
    },
    {
      name: 'desktop-wide',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      },
    },
    {
      name: 'desktop-ultrawide',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Tablet Testing (768px-1199px)
    {
      name: 'tablet-portrait',
      use: { 
        ...devices['iPad'],
        viewport: { width: 768, height: 1024 }
      },
    },
    {
      name: 'tablet-landscape',
      use: { 
        ...devices['iPad'],
        viewport: { width: 1024, height: 768 }
      },
    },
    {
      name: 'tablet-large',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1199, height: 800 }
      },
    },

    // Mobile Testing (≤767px)
    {
      name: 'mobile-small',
      use: { 
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 }
      },
    },
    {
      name: 'mobile-medium',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 }
      },
    },
    {
      name: 'mobile-large',
      use: { 
        ...devices['iPhone 12 Pro Max'],
        viewport: { width: 428, height: 926 }
      },
    },
    {
      name: 'mobile-boundary',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 767, height: 800 }
      },
    },

    // Breakpoint Boundary Testing
    {
      name: 'tablet-min-boundary',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 800 }
      },
    },
    {
      name: 'desktop-min-boundary',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1200, height: 800 }
      },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});