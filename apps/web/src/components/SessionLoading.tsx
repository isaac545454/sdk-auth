import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@isaac545454/nucleus";

export function SessionLoading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Abrindo sessão</CardTitle>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-2/3" />
      </CardContent>
    </Card>
  );
}
