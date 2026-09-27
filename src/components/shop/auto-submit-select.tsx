"use client";

import type { ComponentProps } from "react";

/** <select> que envía su formulario al cambiar (p. ej. ordenar). */
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
