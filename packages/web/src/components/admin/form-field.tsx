'use client';

import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

/* ------------------------------------------------------------------ */
/*  Shared wrapper                                                     */
/* ------------------------------------------------------------------ */

interface FormFieldWrapperProps {
  label: string;
  htmlFor?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormFieldWrapper({
  label,
  htmlFor,
  error,
  helperText,
  required,
  children,
}: FormFieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-[var(--color-text-secondary)]"
      >
        {label}
        {required && <span className="ml-0.5 text-[var(--color-error)]">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Input styles (shared)                                              */
/* ------------------------------------------------------------------ */

const baseInputClasses =
  'w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed';

const errorInputClasses = 'border-[var(--color-error)] focus:border-[var(--color-error)]';

/* ------------------------------------------------------------------ */
/*  FormInput                                                          */
/* ------------------------------------------------------------------ */

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function FormInput({ label, error, helperText, required, id, ...rest }: FormInputProps) {
  return (
    <FormFieldWrapper label={label} htmlFor={id} error={error} helperText={helperText} required={required}>
      <input
        id={id}
        required={required}
        className={`${baseInputClasses} ${error ? errorInputClasses : ''}`}
        {...rest}
      />
    </FormFieldWrapper>
  );
}

/* ------------------------------------------------------------------ */
/*  FormSelect                                                         */
/* ------------------------------------------------------------------ */

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function FormSelect({
  label,
  error,
  helperText,
  required,
  id,
  options,
  placeholder,
  ...rest
}: FormSelectProps) {
  return (
    <FormFieldWrapper label={label} htmlFor={id} error={error} helperText={helperText} required={required}>
      <select
        id={id}
        required={required}
        className={`${baseInputClasses} ${error ? errorInputClasses : ''}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormFieldWrapper>
  );
}

/* ------------------------------------------------------------------ */
/*  FormTextarea                                                       */
/* ------------------------------------------------------------------ */

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function FormTextarea({ label, error, helperText, required, id, ...rest }: FormTextareaProps) {
  return (
    <FormFieldWrapper label={label} htmlFor={id} error={error} helperText={helperText} required={required}>
      <textarea
        id={id}
        required={required}
        rows={4}
        className={`${baseInputClasses} resize-y ${error ? errorInputClasses : ''}`}
        {...rest}
      />
    </FormFieldWrapper>
  );
}
