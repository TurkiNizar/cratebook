import { randomUUID } from "node:crypto";

import type { Metadata } from "next";
import Link from "next/link";

import { RecordForm } from "@/components/record-form";

import { createManualRecord } from "./actions";

export const metadata: Metadata = { title: "Add a record manually" };

export default function ManualRecordPage() {
  return (
    <main className="app-content manual-record-page">
      <Link className="back-link" href="/add">
        ← Add options
      </Link>
      <p className="app-kicker">Manual entry</p>
      <h1>Add a record</h1>
      <p className="app-description">
        Start with what you know. You can add copy condition, purchase details,
        and your story later.
      </p>
      <RecordForm
        action={createManualRecord}
        entryKey={randomUUID()}
        variant="create"
      />
    </main>
  );
}
