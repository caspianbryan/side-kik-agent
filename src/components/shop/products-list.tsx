"use client";

import { useState, useTransition } from "react";
import { ChevronRightIcon, PackageIcon, PlusIcon } from "lucide-react";
import { setProductStock } from "@/app/shop-actions";
import { ProductSheet } from "@/components/shop/product-sheet";
import type { ProductView } from "@/components/shop/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { kes } from "@/lib/format";
import { cn } from "@/lib/utils";

function StockSwitch({ p }: { p: ProductView }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <Switch
        checked={p.inStock}
        disabled={pending}
        aria-label={`${p.name} in stock`}
        onCheckedChange={(v) => start(() => setProductStock(p.id, v))}
      />
      <span className="w-16">{p.inStock ? "In stock" : "Sold out"}</span>
    </label>
  );
}

export function ProductsList({ products }: { products: ProductView[] }) {
  const [open, setOpen] = useState<ProductView | "new" | null>(null);

  return (
    <section aria-labelledby="products-h" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="products-h" className="text-base font-medium">
          Catalogue <span className="ml-1 text-sm text-muted-foreground tabular-nums">{products.length}</span>
        </h2>
        <Button onClick={() => setOpen("new")}>
          <PlusIcon />
          Add product
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
          <PackageIcon className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No products yet. Add the first one, or load the demo shop in Settings.</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card">
          {products.map((p, i) => (
            <li key={p.id} className="border-b last:border-b-0">
              <div
                role="button"
                tabIndex={0}
                aria-label={`Edit ${p.name}`}
                onClick={() => setOpen(p)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpen(p);
                  }
                }}
                className={cn(
                  "group grid cursor-pointer grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors duration-150 outline-none hover:bg-accent/50 focus-visible:bg-accent/60 sm:px-5 md:grid-cols-[2rem_minmax(0,1fr)_8rem_9rem_1.25rem]",
                  !p.active && "opacity-60",
                )}
              >
                <span className="font-display text-center text-sm text-muted-foreground">{i + 1}</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{p.name}</span>
                    {p.isDemo && <Badge variant="warning">Demo</Badge>}
                    {!p.active && <Badge variant="outline">Hidden</Badge>}
                  </p>
                  {p.description && <p className="truncate text-xs text-muted-foreground">{p.description}</p>}
                </div>
                <p className="font-display text-right text-[1.0625rem] leading-tight">{kes(p.priceKes)}</p>
                <div
                  className="col-span-3 col-start-2 md:col-span-1 md:col-start-auto"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <StockSwitch p={p} />
                </div>
                <ChevronRightIcon className="hidden size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 md:block" />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">Customers see products in this order, numbered as shown.</p>
      <ProductSheet product={open} onOpenChange={(o) => !o && setOpen(null)} />
    </section>
  );
}
