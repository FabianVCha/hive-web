import { simulatePayment, type OrderSnapshot } from "./guest-checkout.ts";

export type PaymentProviderName = "demo";
export type PaymentResult = {
  provider: PaymentProviderName;
  status: "paid" | "pending" | "failed";
  reference: string;
  order: OrderSnapshot;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createPayment(order: OrderSnapshot): Promise<PaymentResult>;
}

export class DemoPaymentProvider implements PaymentProvider {
  readonly name = "demo" as const;

  async createPayment(order: OrderSnapshot): Promise<PaymentResult> {
    return {
      provider: this.name,
      status: "paid",
      reference: order.reference,
      order: simulatePayment(order),
    };
  }
}

export function createPaymentProvider(name: string = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? "demo"): PaymentProvider {
  if (name === "demo") return new DemoPaymentProvider();
  throw new Error(`Unsupported payment provider: ${name}`);
}
