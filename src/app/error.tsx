"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <CardTitle>Algo deu errado</CardTitle>
          <CardDescription>
            Ocorreu um erro inesperado. Tente novamente ou volte para o início.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = "/")}
          >
            Voltar ao início
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
