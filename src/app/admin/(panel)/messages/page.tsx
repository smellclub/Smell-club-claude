import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { cn, formatDate } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";
import { deleteMessage, toggleMessageRead } from "./actions";

export const metadata = { title: "Mensajes" };

type Message = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default async function AdminMessagesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, message, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const messages = (data ?? []) as Message[];

  return (
    <>
      <PageHeader title="Mensajes" description="Enviados desde el formulario de contacto (últimos 200)." />
      {messages.length === 0 ? (
        <p className="border border-dashed border-line bg-white p-10 text-center text-sm text-muted">No hay mensajes.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((m) => {
            const wa = m.phone ? whatsappLink(`Hola ${m.name}, te escribimos de Smellclub.`, m.phone) : null;
            return (
              <li key={m.id} className={cn("border bg-white p-5", m.is_read ? "border-line" : "border-gold")}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {!m.is_read && <span className="mr-2 inline-block size-2 rounded-full bg-gold" aria-label="Sin leer" />}
                    {m.name}
                  </p>
                  <p className="text-xs text-muted">{formatDate(m.created_at)}</p>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {m.email && <a href={`mailto:${m.email}`} className="underline">{m.email}</a>}
                  {m.email && m.phone && " · "}
                  {m.phone && (wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="underline">{m.phone}</a> : m.phone)}
                </p>
                <p className="mt-3 text-sm whitespace-pre-line">{m.message}</p>
                <div className="mt-4 flex gap-2">
                  <ActionForm action={toggleMessageRead} showMessage={false}>
                    <input type="hidden" name="messageId" value={m.id} />
                    <input type="hidden" name="isRead" value={String(!m.is_read)} />
                    <SubmitButton variant="outline" size="sm" pendingText="…">
                      {m.is_read ? "Marcar no leído" : "Marcar leído"}
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm action={deleteMessage} showMessage={false} confirmMessage="¿Eliminar este mensaje?">
                    <input type="hidden" name="messageId" value={m.id} />
                    <SubmitButton variant="danger" size="sm" pendingText="…">Eliminar</SubmitButton>
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
