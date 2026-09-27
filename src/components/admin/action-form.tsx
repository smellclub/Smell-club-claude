"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FormAlert } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/types/domain";

type Ctx = { state: ActionState; pending: boolean };
const FormCtx = createContext<Ctx>({ state: { ok: false }, pending: false });

export function useFormState() {
  return useContext(FormCtx);
}

/**
 * Formulario genérico del panel para Server Actions:
 *  - no vacía los campos si hay errores
 *  - confirmación opcional (acciones destructivas)
 *  - muestra mensajes y errores por campo (via useFormState)
 */
export function ActionForm({
  action,
  children,
  className,
  confirmMessage,
  showMessage = true,
  resetOnSuccess = false,
  onSuccess,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  confirmMessage?: string;
  showMessage?: boolean;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [state, dispatch, pending] = useActionState(action, { ok: false });
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const handled = useRef<ActionState | null>(null);

  useEffect(() => {
    if (handled.current === state) return;
    handled.current = state;
    if (state.ok) {
      if (resetOnSuccess) formRef.current?.reset();
      onSuccess?.();
      router.refresh();
    }
  }, [state, resetOnSuccess, onSuccess, router]);

  return (
    <FormCtx.Provider value={{ state, pending }}>
      <form
        ref={formRef}
        noValidate
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          const fd = new FormData(e.currentTarget);
          startTransition(() => dispatch(fd));
        }}
      >
        {showMessage && state.message && (
          <div className="mb-4">
            <FormAlert tone={state.ok ? "success" : "error"}>{state.message}</FormAlert>
          </div>
        )}
        {children}
      </form>
    </FormCtx.Provider>
  );
}

export function SubmitButton({
  children,
  pendingText = "Guardando…",
  variant = "primary",
  size = "md",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "gold" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { pending } = useFormState();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
      {pending ? pendingText : children}
    </Button>
  );
}

export function useFieldError(name: string): string | undefined {
  return useFormState().state.fieldErrors?.[name];
}
