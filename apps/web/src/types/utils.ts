/**
 * @fileoverview Utility Types - Common TypeScript Patterns
 * @module types/utils
 *
 * Reusable type utilities for better type safety across the application.
 * These complement TypeScript's built-in utility types.
 */

// ============================================================================
// STRICT UTILITIES
// ============================================================================

/**
 * Make all properties in T required and non-nullable
 * Stricter version of Required<T>
 */
export type StrictRequired<T> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

/**
 * Pick properties from T and make them required
 */
export type RequiredPick<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// ============================================================================
// ASYNC/PROMISE UTILITIES
// ============================================================================

/**
 * Extract the resolved type from a Promise
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Type for async function return values
 */
export type AsyncReturnType<T extends (...args: unknown[]) => Promise<unknown>> = T extends (
  ...args: unknown[]
) => Promise<infer R>
  ? R
  : never;

/**
 * Make function async
 */
export type AsyncFunction<T extends (...args: unknown[]) => unknown> = (
  ...args: Parameters<T>
) => Promise<ReturnType<T>>;

// ============================================================================
// LOADING/ERROR STATE UTILITIES
// ============================================================================

/**
 * Standard loading state for data fetching
 */
export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Data with loading state
 */
export type WithLoading<T> = T & LoadingState;

/**
 * Async data wrapper with loading states
 */
export interface AsyncData<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching?: boolean;
  refetch?: () => void;
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// ============================================================================
// FORM UTILITIES
// ============================================================================

/**
 * Form field with value and validation
 */
export interface FormField<T> {
  value: T;
  error?: string;
  touched: boolean;
  isValid: boolean;
}

/**
 * Form state from an object type
 */
export type FormState<T> = {
  [K in keyof T]: FormField<T[K]>;
};

/**
 * Extract values from FormState
 */
export type FormValues<T> = {
  [K in keyof T]: T[K] extends FormField<infer V> ? V : never;
};

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Get keys of T as string literal union
 */
export type Keys<T> = keyof T & string;

/**
 * Get values of T as union type
 */
export type Values<T> = T[keyof T];

/**
 * Deep partial - make all nested properties optional
 */
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

/**
 * Deep readonly - make all nested properties readonly
 */
export type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

/**
 * Merge two types, with T2 overriding T1
 */
export type Merge<T1, T2> = Omit<T1, keyof T2> & T2;

/**
 * Object with string keys and values of type T
 */
export type StringRecord<T> = Record<string, T>;

// ============================================================================
// FUNCTION UTILITIES
// ============================================================================

/**
 * Extract function parameters as tuple
 */
export type Args<T extends (...args: unknown[]) => unknown> = Parameters<T>;

/**
 * Make function return void
 */
export type VoidFunction<T extends (...args: unknown[]) => unknown> = (
  ...args: Parameters<T>
) => void;

/**
 * Callback with optional error
 */
export type Callback<T = void> = (error?: Error | null, result?: T) => void;

// ============================================================================
// COMPONENT UTILITIES
// ============================================================================

/**
 * Props with children
 */
export interface WithChildren {
  children: React.ReactNode;
}

/**
 * Props with optional className
 */
export interface WithClassName {
  className?: string;
}

/**
 * Common component props
 */
export type ComponentProps = WithClassName & Partial<WithChildren>;

/**
 * Extract props from a React component
 */
export type PropsOf<C extends React.ComponentType<unknown>> =
  C extends React.ComponentType<infer P> ? P : never;

/**
 * Props with test ID for testing
 */
export interface WithTestId {
  "data-testid"?: string;
}

// ============================================================================
// NUMERIC UTILITIES
// ============================================================================

/**
 * Numeric range (inclusive)
 */
export interface NumericRange {
  min: number;
  max: number;
}

/**
 * BigInt or number
 */
export type Numeric = number | bigint;

/**
 * String that represents a number
 */
export type NumericString = `${number}`;

// ============================================================================
// BRAND TYPES (Nominal Typing)
// ============================================================================

/**
 * Create a branded/nominal type for stronger type safety
 *
 * @example
 * ```ts
 * type UserId = Brand<string, "UserId">;
 * type PoolId = Brand<number, "PoolId">;
 *
 * // These are not assignable to each other even though both are strings/numbers
 * const userId: UserId = "abc" as UserId;
 * const otherUserId: UserId = userId; // OK
 * const poolId: PoolId = userId; // Error!
 * ```
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Common branded types
 */
export type Wei = Brand<bigint, "Wei">;
export type Ether = Brand<string, "Ether">;
export type BasisPoints = Brand<number, "BasisPoints">;
export type PoolId = Brand<number, "PoolId">;
export type RoundId = Brand<number, "RoundId">;
export type HexString = Brand<`0x${string}`, "HexString">;
