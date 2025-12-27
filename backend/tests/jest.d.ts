/// <reference types="jest" />

// This file provides Jest type definitions for TypeScript
// It ensures that jest globals like describe, it, expect, etc. are recognized

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}

export {};
