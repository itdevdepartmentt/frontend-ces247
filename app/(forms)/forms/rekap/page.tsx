import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubmissionRecap } from "@/components/forms/submission-recap";

export default function SubmissionRecapPage() {
  return (
    <div className="operations-page">
      <Link
        href="/forms"
        className="flex min-h-10 w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Semua formulir
      </Link>
      <SubmissionRecap />
    </div>
  );
}
