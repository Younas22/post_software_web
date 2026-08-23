import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileQuestion className="size-7" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-foreground">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}
