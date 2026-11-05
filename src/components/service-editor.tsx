"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { updateService, type ActionState } from "@/app/actions";
import { WaText } from "@/components/wa-text";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type S = {
  id: number;
  menuKey: string;
  name: string;
  keywords: string;
  priceKes: number;
  checklist: string;
  active: boolean;
  updatedAt: string;
};

export function ServiceEditor({ service }: { service: S }) {
  const [text, setText] = useState(service.checklist);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await updateService(prev, fd);
    if (result.ok) toast.success(`${fd.get("name")} saved`, { description: "The bot uses it from the next message." });
    return result;
  }, { ok: true });
  const id = (k: string) => `svc-${service.id}-${k}`;
  const over = text.length > 3500;

  return (
    <Card>
      <form action={action} className="contents">
        <input type="hidden" name="id" value={service.id} />
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-base">
            <span className="font-display flex size-7 items-center justify-center rounded-md border text-sm text-muted-foreground">
              {service.menuKey}
            </span>
            {service.name}
          </CardTitle>
          <CardDescription>
            Last updated{" "}
            {new Date(service.updatedAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
          </CardDescription>
          <CardAction className="flex items-center gap-2 pt-1">
            <Switch id={id("active")} name="active" defaultChecked={service.active} />
            <Label htmlFor={id("active")} className="font-normal text-muted-foreground">In menu</Label>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr_9rem]">
            <div className="space-y-2">
              <Label htmlFor={id("name")}>Menu name</Label>
              <Input id={id("name")} name="name" defaultValue={service.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={id("kw")}>Keywords that pick it</Label>
              <Input id={id("kw")} name="keywords" defaultValue={service.keywords} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={id("price")}>Your fee (KES)</Label>
              <Input id={id("price")} name="priceKes" type="number" min={0} defaultValue={service.priceKes} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={id("text")}>Checklist reply</Label>
              <Textarea
                id={id("text")}
                name="checklist"
                rows={16}
                value={text}
                aria-invalid={over || undefined}
                onChange={(e) => setText(e.target.value)}
                className="field-sizing-fixed font-mono text-[0.8125rem] leading-6"
              />
              <p className={`text-xs ${over ? "text-destructive" : "text-muted-foreground"}`}>
                {text.length.toLocaleString()} of 3,500 characters. *Bold* and _italic_ work like in WhatsApp.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">How it looks in WhatsApp</p>
              <div className="rounded-lg border bg-chat-wall p-4">
                <div className="mr-auto max-w-[92%] rounded-lg rounded-bl-sm border bg-bubble-in px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                  <WaText text={text} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending || over}>{pending ? "Saving…" : "Save checklist"}</Button>
            {!state.ok && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
