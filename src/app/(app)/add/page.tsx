import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add a record" };

export default function AddPage() {
  return (
    <main className="app-content">
      <p className="app-kicker">A new find</p>
      <h1>Add a record</h1>
      <p className="app-description">
        Manual entry and catalogue search are planned for the collection
        milestone.
      </p>
    </main>
  );
}
