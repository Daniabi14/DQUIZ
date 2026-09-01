import { QuizBuilderView } from "@/components/quiz/QuizBuilderView";

export async function generateStaticParams() {
  return [{ id: "new" }];
}

export default function QuizBuilderPage() {
  return <QuizBuilderView />;
}
