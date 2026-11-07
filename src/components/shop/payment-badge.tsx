import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_LABEL, type PaymentStatus } from "@/lib/constants";

const VARIANT = {
  unpaid: "outline",
  claimed: "warning",
  verified: "success",
  mismatch: "destructive",
} as const;

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={VARIANT[status]}>{PAYMENT_STATUS_LABEL[status]}</Badge>;
}
