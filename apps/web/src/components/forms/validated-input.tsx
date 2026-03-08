/**
 * @fileoverview Validated Input Component
 * @module components/forms/validated-input
 *
 * Input component with built-in Zod validation and React Hook Form integration.
 * Shows validation errors inline for better UX.
 */

"use client";

import * as React from "react";
import {
  type UseFormRegister,
  type FieldError,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ZodSchema } from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ValidatedInputProps<TFieldValues extends FieldValues = FieldValues> extends Omit<
  React.ComponentProps<"input">,
  "name"
> {
  /**
   * Field name (must match form schema)
   */
  name: Path<TFieldValues>;
  /**
   * Label text
   */
  label?: string;
  /**
   * Helper text shown below input
   */
  helperText?: string;
  /**
   * Validation error from React Hook Form
   */
  error?: FieldError;
  /**
   * React Hook Form register function
   */
  register?: UseFormRegister<TFieldValues>;
  /**
   * Show validation status icon
   * @default true
   */
  showValidationIcon?: boolean;
  /**
   * Show success state when valid
   * @default false
   */
  showSuccess?: boolean;
  /**
   * Is field required
   * @default false
   */
  required?: boolean;
  /**
   * Custom error message
   */
  errorMessage?: string;
  /**
   * Additional wrapper className
   */
  wrapperClassName?: string;
}

/**
 * ValidatedInput - Input with integrated validation display
 * Works seamlessly with React Hook Form and Zod schemas
 *
 * @example
 * ```tsx
 * import { useForm } from "react-hook-form";
 * import { zodResolver } from "@hookform/resolvers/zod";
 * import { depositSchema } from "@/lib/validation/schemas";
 *
 * function DepositForm() {
 *   const { register, formState: { errors } } = useForm({
 *     resolver: zodResolver(depositSchema)
 *   });
 *
 *   return (
 *     <ValidatedInput
 *       name="amount"
 *       label="Amount"
 *       register={register}
 *       error={errors.amount}
 *       placeholder="0.00"
 *       required
 *     />
 *   );
 * }
 * ```
 */
export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps<FieldValues>>(
  (
    {
      name,
      label,
      helperText,
      error,
      register,
      showValidationIcon = true,
      showSuccess = false,
      required = false,
      errorMessage,
      wrapperClassName,
      className,
      ...props
    },
    ref
  ) => {
    const hasError = !!error || !!errorMessage;
    const isValid = !hasError && showSuccess && props.value;

    // Get registration props from React Hook Form
    const registrationProps = register ? register(name) : {};

    return (
      <div className={cn("space-y-2", wrapperClassName)}>
        {/* Label */}
        {label && (
          <Label htmlFor={name} className="flex items-center gap-1">
            {label}
            {required && <span className="text-error">*</span>}
          </Label>
        )}

        {/* Input with validation icon */}
        <div className="relative">
          <Input
            id={name}
            ref={ref}
            className={cn(
              showValidationIcon && (hasError || isValid) && "pr-10",
              hasError && "border-error focus-visible:ring-error",
              isValid && "border-success focus-visible:ring-success",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${name}-error` : helperText ? `${name}-description` : undefined
            }
            {...registrationProps}
            {...props}
          />

          {/* Validation icon */}
          {showValidationIcon && hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-error" aria-hidden="true" />
            </div>
          )}
          {showValidationIcon && isValid && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Helper text or error message */}
        {hasError ? (
          <p
            id={`${name}-error`}
            className="flex items-start gap-1 text-sm text-error"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{errorMessage || error?.message}</span>
          </p>
        ) : helperText ? (
          <p id={`${name}-description`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

/**
 * Standalone validation error display
 * Use when you need to show validation errors without an input
 */
export function ValidationError({
  error,
  className,
}: {
  error?: string | FieldError;
  className?: string;
}) {
  if (!error) return null;

  const message = typeof error === "string" ? error : error.message;

  return (
    <p className={cn("flex items-start gap-1 text-sm text-error", className)} role="alert">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

/**
 * Field group wrapper for better form layout
 */
export function FieldGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

/**
 * Inline validation helper
 * Validates a value against a Zod schema and returns error message
 */
export function useInlineValidation<T>(schema: ZodSchema<T>) {
  const [error, setError] = React.useState<string | undefined>();

  const validate = React.useCallback(
    (value: unknown) => {
      const result = schema.safeParse(value);
      if (result.success) {
        setError(undefined);
        return true;
      } else {
        setError(result.error.errors[0]?.message);
        return false;
      }
    },
    [schema]
  );

  const clearError = React.useCallback(() => {
    setError(undefined);
  }, []);

  return { error, validate, clearError };
}
