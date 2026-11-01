import { getCustomers } from "@/lib/customers";
import { PageHeader } from "@/components/admin/ui";
import { CustomersView } from "./CustomersView";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { customers, asOf } = await getCustomers();
  return (
    <>
      <PageHeader title="Customers" sub="Everyone who has ordered online, who comes back most, and who you haven't seen in a while." />
      <CustomersView customers={customers} now={asOf} />
    </>
  );
}
