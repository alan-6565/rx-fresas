import { getSpots } from "@/lib/catalog";
import { getDelivery } from "@/lib/delivery-store";
import OrderForm from "./OrderForm";

export default async function OrderPage() {
  const [spots, delivery] = await Promise.all([getSpots(), getDelivery()]);
  return <OrderForm spots={spots} delivery={delivery} />;
}
