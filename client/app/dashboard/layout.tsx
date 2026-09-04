import Protected from "@/components/Protected";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Protected>{children}</Protected>;
}
