import { StudentGameView } from "@/components/student/StudentGameView";

export async function generateStaticParams() {
  return [{ id: "live" }];
}

export default function StudentGamePage() {
  return <StudentGameView />;
}
