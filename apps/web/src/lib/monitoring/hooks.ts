/**
 * @fileoverview React Performance Hooks
 * @module lib/monitoring/hooks
 *
 * React hooks for performance monitoring:
 * - useRenderCount: Track component renders
 * - usePerformanceMark: Create performance marks
 * - useMeasure: Measure between marks
 * - useWhyDidYouRender: Debug re-renders
 */

"use client";

import { useEffect, useRef } from "react";

import { performanceMonitor } from "./performance";

/**
 * Track how many times a component renders
 * Useful for debugging unnecessary re-renders
 *
 * @param componentName - Name of the component
 * @param logThreshold - Only log if renders exceed this number
 * @returns Current render count
 *
 * @example
 * function MyComponent() {
 *   const renderCount = useRenderCount('MyComponent', 5);
 *   return <div>Rendered {renderCount} times</div>;
 * }
 */
export function useRenderCount(componentName: string, logThreshold = 10): number {
  const renderCount = useRef(0);

  renderCount.current += 1;

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (renderCount.current > logThreshold) {
        // eslint-disable-next-line no-console
        console.warn(
          `[RenderCount] ${componentName} has rendered ${renderCount.current} times (threshold: ${logThreshold})`
        );
      }
    }
  });

  return renderCount.current;
}

/**
 * Create a performance mark when component mounts/updates
 * Automatically ends the mark when component unmounts
 *
 * @param markName - Name of the performance mark
 * @param deps - Dependencies that trigger new marks
 *
 * @example
 * function MyComponent({ userId }) {
 *   usePerformanceMark('MyComponent:mount');
 *   usePerformanceMark('MyComponent:userLoad', [userId]);
 *   return <div>Content</div>;
 * }
 */
export function usePerformanceMark(markName: string, deps: unknown[] = []): void {
  useEffect(() => {
    performanceMonitor.startMark(markName);

    return () => {
      performanceMonitor.endMark(markName);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Measure time between two operations
 * Returns duration in milliseconds
 *
 * @param measureName - Name for this measurement
 * @returns Functions to start and end measurement, and current duration
 *
 * @example
 * function MyComponent() {
 *   const { start, end, duration } = useMeasure('dataFetch');
 *
 *   const fetchData = async () => {
 *     start();
 *     await api.getData();
 *     end();
 *   };
 *
 *   return <div>Last fetch: {duration}ms</div>;
 * }
 */
export function useMeasure(measureName: string): {
  start: () => void;
  end: () => void;
  duration: number | null;
} {
  const durationRef = useRef<number | null>(null);

  const start = () => {
    performanceMonitor.startMark(measureName);
  };

  const end = () => {
    const duration = performanceMonitor.endMark(measureName);
    durationRef.current = duration;
  };

  return {
    start,
    end,
    duration: durationRef.current,
  };
}

/**
 * Debug why a component re-rendered
 * Logs which props/state changed to cause re-render
 * Only active in development
 *
 * @param componentName - Name of the component
 * @param props - Props object to track
 *
 * @example
 * function MyComponent({ userId, data, onUpdate }) {
 *   useWhyDidYouRender('MyComponent', { userId, data, onUpdate });
 *   return <div>Content</div>;
 * }
 */
export function useWhyDidYouRender(componentName: string, props: Record<string, unknown>): void {
  const previousProps = useRef<Record<string, unknown> | undefined>(undefined);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (previousProps.current) {
        const changedProps: Record<string, { from: unknown; to: unknown }> = {};

        // Check which props changed
        for (const key in props) {
          if (props[key] !== previousProps.current[key]) {
            changedProps[key] = {
              from: previousProps.current[key],
              to: props[key],
            };
          }
        }

        // Check for removed props
        for (const key in previousProps.current) {
          if (!(key in props)) {
            changedProps[key] = {
              from: previousProps.current[key],
              to: undefined,
            };
          }
        }

        if (Object.keys(changedProps).length > 0) {
          // eslint-disable-next-line no-console
          console.group(`[WhyDidYouRender] ${componentName}`);
          // eslint-disable-next-line no-console
          console.log("Changed props:", changedProps);
          // eslint-disable-next-line no-console
          console.groupEnd();
        }
      }

      previousProps.current = props;
    }
  });
}

/**
 * Track component lifecycle performance
 * Measures mount, update, and unmount times
 *
 * @param componentName - Name of the component
 *
 * @example
 * function MyComponent() {
 *   useComponentLifecycle('MyComponent');
 *   return <div>Content</div>;
 * }
 */
export function useComponentLifecycle(componentName: string): void {
  const mountTime = useRef<number | undefined>(undefined);
  const updateCount = useRef(0);

  // Track mount
  useEffect(() => {
    mountTime.current = Date.now();
    performanceMonitor.startMark(`${componentName}:mount`);

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log(`[Lifecycle] ${componentName} mounted`);
    }

    return () => {
      const mountDuration = performanceMonitor.endMark(`${componentName}:mount`);
      const totalTime = mountTime.current ? Date.now() - mountTime.current : 0;

      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log(
          `[Lifecycle] ${componentName} unmounted (mount: ${mountDuration?.toFixed(2)}ms, lifetime: ${totalTime}ms, updates: ${updateCount.current})`
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track updates
  useEffect(() => {
    if (mountTime.current) {
      updateCount.current += 1;

      if (process.env.NODE_ENV === "development" && updateCount.current > 0) {
        // eslint-disable-next-line no-console
        console.log(`[Lifecycle] ${componentName} updated (count: ${updateCount.current})`);
      }
    }
  });
}

/**
 * Measure async operation performance
 * Wraps an async function with performance tracking
 *
 * @param operationName - Name for the operation
 * @returns Wrapped function that tracks performance
 *
 * @example
 * function MyComponent() {
 *   const fetchData = useAsyncPerformance('fetchUserData', async (userId) => {
 *     return await api.getUser(userId);
 *   });
 *
 *   return <button onClick={() => fetchData('123')}>Fetch</button>;
 * }
 */
export function useAsyncPerformance<TArgs extends unknown[], TResult>(
  operationName: string,
  asyncFn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  const wrappedFn = async (...args: TArgs): Promise<TResult> => {
    return performanceMonitor.measureAsync(operationName, () => asyncFn(...args));
  };

  return wrappedFn;
}

/**
 * Track long-running effect
 * Warns if effect takes too long to execute
 *
 * @param effectName - Name of the effect
 * @param effect - Effect function
 * @param deps - Effect dependencies
 * @param warnThreshold - Warn if effect takes longer than this (ms)
 *
 * @example
 * function MyComponent({ data }) {
 *   useLongRunningEffect('processData', () => {
 *     // Expensive computation
 *     processData(data);
 *   }, [data], 100);
 * }
 */
export function useLongRunningEffect(
  effectName: string,
  effect: () => void | (() => void),
  deps: unknown[],
  warnThreshold = 50
): void {
  useEffect(() => {
    const startTime = performance.now();
    const cleanup = effect();
    const duration = performance.now() - startTime;

    if (process.env.NODE_ENV === "development" && duration > warnThreshold) {
      // eslint-disable-next-line no-console
      console.warn(
        `[LongEffect] ${effectName} took ${duration.toFixed(2)}ms (threshold: ${warnThreshold}ms)`
      );
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
