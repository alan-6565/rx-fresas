import { getSpots } from "@/lib/catalog";
import OrderForm from "./OrderForm";

export default async function OrderPage() {
  return <OrderForm spots={await getSpots()} />;
}
