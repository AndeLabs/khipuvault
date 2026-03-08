/**
 * @fileoverview Reusable Form Field Components
 * @module components/forms/form-field
 *
 * Consistent form field wrappers with labels, errors, and descriptions.
 */

"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ============================================================================
// BASE FORM FIELD
// ============================================================================

interface FormFieldProps {
  /** Field label */
  label: string;
  /** Field ID for accessibility */
  id: string;
  /** Error message */
  error?: string;
  /** Helper text below field */
  description?: string;
  /** Required indicator */
  required?: boolean;
  /** Additional className */
  className?: string;
  /** Children (the actual input) */
  children: React.ReactNode;
}

/**
 * Base form field wrapper with label and error handling
 */
export function FormField({
  label,
  id,
  error,
  description,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ============================================================================
// TEXT INPUT FIELD
// ============================================================================

interface TextFieldProps extends Omit<FormFieldProps, "children"> {
  /** Input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Input type */
  type?: "text" | "email" | "password" | "number";
  /** Whether field is disabled */
  disabled?: boolean;
  /** Maximum length */
  maxLength?: number;
}

/**
 * Text input field with label and error handling
 */
export function TextField({
  label,
  id,
  value,
  onChange,
  error,
  description,
  required,
  placeholder,
  type = "text",
  disabled,
  maxLength,
  className,
}: TextFieldProps) {
  return (
    <FormField
      label={label}
      id={id}
      error={error}
      description={description}
      required={required}
      className={className}
    >
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={cn(error && "border-destructive")}
      />
    </FormField>
  );
}

// ============================================================================
// NUMBER INPUT FIELD
// ============================================================================

interface NumberFieldProps extends Omit<FormFieldProps, "children"> {
  /** Input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step value */
  step?: number;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Unit label (e.g., "BTC", "mUSD") */
  unit?: string;
}

/**
 * Number input field optimized for crypto amounts
 */
export function NumberField({
  label,
  id,
  value,
  onChange,
  error,
  description,
  required,
  placeholder = "0.00",
  min,
  max,
  step = 0.01,
  disabled,
  unit,
  className,
}: NumberFieldProps) {
  return (
    <FormField
      label={label}
      id={id}
      error={error}
      description={description}
      required={required}
      className={className}
    >
      <div className="relative">
        <Input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            "pr-12",
            error && "border-destructive",
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          )}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </FormField>
  );
}

// ============================================================================
// SLIDER FIELD
// ============================================================================

interface SliderFieldProps extends Omit<FormFieldProps, "children"> {
  /** Current value */
  value: number[];
  /** Change handler */
  onChange: (value: number[]) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step value */
  step?: number;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Format function for display value */
  formatValue?: (value: number) => string;
}

/**
 * Slider input field with value display
 */
export function SliderField({
  label,
  id,
  value,
  onChange,
  error,
  description,
  required,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  formatValue = (v) => v.toString(),
  className,
}: SliderFieldProps) {
  return (
    <FormField
      label={label}
      id={id}
      error={error}
      description={description}
      required={required}
      className={className}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {min} - {max}
          </span>
          <span className="text-sm font-medium">{formatValue(value[0])}</span>
        </div>
        <Slider
          id={id}
          value={value}
          onValueChange={onChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
        />
      </div>
    </FormField>
  );
}

// ============================================================================
// FIELD GROUP
// ============================================================================

interface FieldGroupProps {
  /** Group title */
  title?: string;
  /** Group description */
  description?: string;
  /** Children fields */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Group related form fields together
 */
export function FieldGroup({ title, description, children, className }: FieldGroupProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h4 className="font-medium">{title}</h4>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
