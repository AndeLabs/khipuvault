/**
 * @vitest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { useReducedMotion, useStaggerDelay } from "../hooks";

describe("Animation Hooks", () => {
  describe("useReducedMotion", () => {
    beforeEach(() => {
      // Mock matchMedia
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it("should return false when prefers-reduced-motion is not set", () => {
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(false);
    });

    it("should return true when prefers-reduced-motion is set", () => {
      // Mock matchMedia to return matches: true
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(true);
    });
  });

  describe("useStaggerDelay", () => {
    beforeEach(() => {
      // Ensure reduced motion is false for these tests
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it("should calculate delay correctly with defaults", () => {
      const { result } = renderHook(() => useStaggerDelay(0));
      expect(result.current).toBe(0);

      const { result: result1 } = renderHook(() => useStaggerDelay(1));
      expect(result1.current).toBe(0.1);

      const { result: result2 } = renderHook(() => useStaggerDelay(2));
      expect(result2.current).toBe(0.2);
    });

    it("should calculate delay with custom base and increment", () => {
      const { result } = renderHook(() => useStaggerDelay(0, 0.5, 0.2));
      expect(result.current).toBe(0.5);

      const { result: result1 } = renderHook(() => useStaggerDelay(1, 0.5, 0.2));
      expect(result1.current).toBe(0.7);

      const { result: result2 } = renderHook(() => useStaggerDelay(2, 0.5, 0.2));
      expect(result2.current).toBe(0.9);
    });

    it("should return 0 when reduced motion is preferred", () => {
      // Mock reduced motion
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useStaggerDelay(5, 0.5, 0.2));
      expect(result.current).toBe(0);
    });
  });
});
