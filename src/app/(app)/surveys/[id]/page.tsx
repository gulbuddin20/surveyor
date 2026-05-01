import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SurveyResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Card className="mx-auto max-w-2xl text-center">
      <CardHeader>
        <CardTitle>Survei tersimpan</CardTitle>
        <CardDescription>ID response: {id}</CardDescription>
      </CardHeader>
      <p className="text-slate-600">Hasil kalkulasi sudah tersimpan di dashboard.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild><Link href="/dashboard">Dashboard</Link></Button>
        <Button asChild variant="outline"><Link href="/surveys">Survei lagi</Link></Button>
      </div>
    </Card>
  );
}
