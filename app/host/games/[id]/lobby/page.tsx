import { HostLobbyView } from "@/components/host/HostLobbyView";

export async function generateStaticParams() {
  return [{ id: "live" }];
}

export default function HostLobbyPage() {
  return <HostLobbyView />;
}
