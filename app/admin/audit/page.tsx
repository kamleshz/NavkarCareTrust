import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin-tabs";
import { requireAdmin } from "@/lib/auth/dal";
import { listAuditEntries } from "@/lib/audit";

export const metadata: Metadata = { title: "Audit log" };

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AdminAuditPage() {
  await requireAdmin();
  const entries = await listAuditEntries(200);

  return (
    <main className="app-main">
      <div className="app-container">
        <header className="app-header">
          <h1>Audit log</h1>
          <p>A record of important administrative and organisational changes, newest first.</p>
        </header>

        <AdminTabs active="/admin/audit" />

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent changes</h2>
              <p>{entries.length} entries</p>
            </div>
          </div>
          {entries.length === 0 ? (
            <div className="panel-body">
              <p className="empty-note">No administrative changes recorded yet.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">Action</th>
                    <th scope="col">Record</th>
                    <th scope="col">Summary</th>
                    <th scope="col">By</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.createdAt)}</td>
                      <td>{entry.action}</td>
                      <td>{entry.entityType}</td>
                      <td>{entry.summary}</td>
                      <td>{entry.actorEmail ?? "System"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
