"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/fields";
import type { ActionState } from "@/types/domain";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, { ok: false });

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.message && <FormAlert>{state.message}</FormAlert>}
      <Field label="Email" name="email" type="email" autoComplete="username" required maxLength={254} />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required maxLength={200} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
