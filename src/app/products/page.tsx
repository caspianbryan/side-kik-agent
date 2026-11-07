import { ProductsList } from "@/components/shop/products-list";
import { ZonesEditor } from "@/components/shop/zones-editor";
import { PageHeader } from "@/components/ui";
import { getProducts, getZones } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, zones] = await Promise.all([getProducts(), getZones()]);
  return (
    <>
      <PageHeader
        title="Products"
        lead="What the shop bot sells. Toggle stock as it changes; the bot stops offering sold-out items straight away."
      />
      <div className="space-y-12">
        <ProductsList
          products={products.map((p) => ({
            id: p.id, name: p.name, description: p.description, priceKes: p.priceKes, inStock: p.inStock,
            keywords: p.keywords, sortOrder: p.sortOrder, active: p.active, isDemo: p.isDemo,
          }))}
        />
        <ZonesEditor zones={zones.map((z) => ({ id: z.id, name: z.name, feeKes: z.feeKes }))} />
      </div>
    </>
  );
}
