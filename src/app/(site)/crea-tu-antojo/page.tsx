import { redirect } from "next/navigation";

// The builder now opens from the menu when someone orders fresas con crema
export default function CreaTuAntojoPage() {
  redirect("/menu?crear=1#fresas");
}
