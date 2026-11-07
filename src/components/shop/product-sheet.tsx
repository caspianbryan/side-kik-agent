"use client";

import { useActionState, useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct, saveProduct, type ActionState } from "@/app/shop-actions";
import type { ProductView } from "@/components/shop/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/** Add (product = "new") or edit a product in a slide-over. */
export function ProductSheet({
  product,
  onOpenChange,
}: {
  product: ProductView | "new" | null;
  onOpenChange: (open: boolean) => void;
}) {
  const isNew = product === "new";
  const p = product && product !== "new" ? product : null;
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await saveProduct(prev, fd);
    if (result.ok) {
      toast.success(result.message);
      onOpenChange(false);
    }
    return result;
  }, { ok: true });

  return (
    <Sheet
      open={!!product}
      onOpenChange={(o) => {
        setConfirming(false);
        onOpenChange(o);
      }}
    >
      <SheetContent side="right" className="w-full gap-0 sm:w-[26rem] sm:max-w-[26rem]">
        {product && (
          <>
            <SheetHeader>
              <SheetTitle className="font-display text-h2 leading-tight font-normal">{isNew ? "New product" : p?.name}</SheetTitle>
              <SheetDescription>Customers see the name, price and description in WhatsApp.</SheetDescription>
            </SheetHeader>
            <form key={p?.id ?? "new"} action={action} className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
              {p && <input type="hidden" name="id" value={p.id} />}
              <div className="space-y-2">
                <Label htmlFor="ps-name">Name</Label>
                <Input id="ps-name" name="name" defaultValue={p?.name} required autoFocus={isNew} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ps-price">Price (KES)</Label>
                  <Input id="ps-price" name="priceKes" type="number" min={0} defaultValue={p?.priceKes ?? ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ps-sort">Position in list</Label>
                  <Input id="ps-sort" name="sortOrder" type="number" min={0} defaultValue={p?.sortOrder ?? 0} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-desc">Description</Label>
                <Textarea id="ps-desc" name="description" rows={3} defaultValue={p?.description} placeholder="Size, colour, what's included" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-kw">Words customers use for it</Label>
                <Input id="ps-kw" name="keywords" defaultValue={p?.keywords} placeholder="bone straight, 18 inch" />
                <p className="text-xs text-muted-foreground">Comma separated. If a customer types one, the bot jumps to this product.</p>
              </div>
              <div className="space-y-3 rounded-lg border p-4">
                <label htmlFor="ps-stock" className="flex items-center justify-between gap-3 text-sm">
                  In stock
                  <Switch id="ps-stock" name="inStock" defaultChecked={p?.inStock ?? true} />
                </label>
                <label htmlFor="ps-active" className="flex items-center justify-between gap-3 text-sm">
                  Show in the bot&apos;s catalogue
                  <Switch id="ps-active" name="active" defaultChecked={p?.active ?? true} />
                </label>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-5">
                <Button type="submit" disabled={pending}>
                  {!isNew ? (pending ? "Saving…" : "Save product") : (
                    <>
                      <PlusIcon />
                      {pending ? "Adding…" : "Add product"}
                    </>
                  )}
                </Button>
                {p &&
                  (confirming ? (
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleting}
                      onClick={() =>
                        startDelete(async () => {
                          await deleteProduct(p.id);
                          toast.success(`Deleted ${p.name}`);
                          onOpenChange(false);
                        })
                      }
                    >
                      {deleting ? "Deleting…" : `Delete ${p.name.length > 18 ? "product" : p.name}`}
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
                      Delete
                    </Button>
                  ))}
                {!state.ok && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
              </div>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
