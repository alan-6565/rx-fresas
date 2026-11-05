import { redirect } from "next/navigation";

// Old "Crea tu antojo" links: each fresas style is ordered from its own card now
export default function CreaTuAntojoPage() {
  redirect("/menu#fresas");
}
