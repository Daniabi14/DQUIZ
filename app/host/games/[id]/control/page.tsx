import { HostControlView } from "@/components/host/HostControlView";

export async function generateStaticParams() {
  return [{ id: "live" }];
}

export default function HostControlPage() {
  return <HostControlView />;
}
