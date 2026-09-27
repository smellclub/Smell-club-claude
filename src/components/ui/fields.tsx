import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Base = { label: string; name: string; error?: string; hint?: ReactNode; className?: string };

function Wrapper({ label, name, error, hint, className, required, children }: Base & { required?: boolean; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-gold-dark" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <p id={`${name}-hint`} className="text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Field({ label, name, error, hint, className, id, ...props }: Base & Omit<ComponentProps<"input">, "name">) {
  return (
    <Wrapper label={label} name={id ?? name} error={error} hint={hint} className={className} required={props.required}>
      <input
        id={id ?? name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id ?? name}-error` : hint ? `${id ?? name}-hint` : undefined}
        className="field"
        {...props}
      />
    </Wrapper>
  );
}

export function TextAreaField({ label, name, error, hint, className, id, ...props }: Base & Omit<ComponentProps<"textarea">, "name">) {
  return (
    <Wrapper label={label} name={id ?? name} error={error} hint={hint} className={className} required={props.required}>
      <textarea
        id={id ?? name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id ?? name}-error` : hint ? `${id ?? name}-hint` : undefined}
        className="field min-h-28 resize-y"
        {...props}
      />
    </Wrapper>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  className,
  id,
  options,
  placeholder,
  ...props
}: Base &
  Omit<ComponentProps<"select">, "name"> & {
    options: readonly { value: string; label: string }[];
    placeholder?: string;
  }) {
  return (
    <Wrapper label={label} name={id ?? name} error={error} hint={hint} className={className} required={props.required}>
      <select
        id={id ?? name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id ?? name}-error` : undefined}
        className="field"
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export function CheckboxField({ label, name, className, ...props }: { label: ReactNode; name: string; className?: string } & Omit<ComponentProps<"input">, "name" | "type">) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center gap-3 text-sm", className)}>
      <input type="checkbox" name={name} className="size-5 shrink-0 accent-ink" {...props} />
      <span>{label}</span>
    </label>
  );
}

/** Campo trampa invisible para bots (no lo ven ni los lectores de pantalla). */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        No rellenar
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "border p-4 text-sm",
        tone === "error" ? "border-danger/40 bg-danger/5 text-danger" : "border-success/40 bg-success/5 text-success",
      )}
    >
      {children}
    </div>
  );
}
