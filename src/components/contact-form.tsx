"use client";

import { startTransition, useActionState } from "react";
import { sendContactMessage } from "@/app/(store)/contact/actions";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Honeypot, TextAreaField } from "@/components/ui/fields";
import type { ActionState } from "@/types/domain";

const initial: ActionState = { ok: false };

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, initial);
  const errors = state.fieldErrors ?? {};

  if (state.ok) {
    return <FormAlert tone="success">{state.message}</FormAlert>;
  }

  return (
    <form
      noValidate
      className="relative flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <Honeypot />
      {state.message && <FormAlert>{state.message}</FormAlert>}
      <Field label="Nombre" name="name" autoComplete="name" required maxLength={120} error={errors.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" autoComplete="email" maxLength={254} error={errors.email} />
        <Field label="Teléfono" name="phone" type="tel" autoComplete="tel" maxLength={30} error={errors.phone} />
      </div>
      <TextAreaField label="Mensaje" name="message" required maxLength={2000} rows={5} error={errors.message} />
      <p className="text-xs text-muted">Indica al menos un email o un teléfono para poder responderte.</p>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enviando…" : "Enviar mensaje"}
      </Button>
    </form>
  );
}
