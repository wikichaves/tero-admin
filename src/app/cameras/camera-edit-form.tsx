"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { saveCamera } from "./actions";

export function CameraEditForm({ children }: { children: ReactNode }) {
  const translations = useTranslations("cameraForm");
  const [status, setStatus] = useState<"saved" | "error" | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    setStatus(null);
    setPending(true);
    try {
      await saveCamera(formData);
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      onChange={() => setStatus(null)}
      className="mt-4 grid gap-4 rounded-lg bg-muted/40 p-4"
    >
      <fieldset disabled={pending} className="grid min-w-0 gap-4">
        {children}
        <Button className="w-fit" type="submit" size="sm" disabled={pending}>
          {translations(pending ? "saving" : "save")}
        </Button>
      </fieldset>
      {status && (
        <p role={status === "error" ? "alert" : "status"} className={status === "error" ? "text-destructive" : "text-muted-foreground"}>
          {translations(status)}
        </p>
      )}
    </form>
  );
}
