import type { OrderStatus, PaymentStatus } from "@/lib/constants";

/** Order as sent to client components (dates as ISO strings). */
export type OrderView = {
  id: number;
  code: string;
  contactId: number | null;
  customerName: string | null;
  phone: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  zoneName: string | null;
  address: string;
  subtotalKes: number;
  deliveryFeeKes: number;
  totalKes: number;
  mpesaCode: string | null;
  mpesaAmountKes: number | null;
  notes: string;
  isDemo: boolean;
  createdAt: string;
  items: { id: number; name: string; priceKes: number; qty: number }[];
};

export type ProductView = {
  id: number;
  name: string;
  description: string;
  priceKes: number;
  inStock: boolean;
  keywords: string;
  sortOrder: number;
  active: boolean;
  isDemo: boolean;
};
