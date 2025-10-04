import React, { useMemo, useState, useEffect } from "react";
import Wizard from "./Wizard";
import ExcelGridView from "./ExcelGridView";

// ---------- Types ----------
type Service = {
  code: string;
  name: string;
};

type MultiEntityRow = {
  account: string; // account name
  services: string[]; // selected service codes for this account
  wpIds: Record<string, string>; // Workday Project ID per service code (read-only)
};

type CISSnapshot = {
  id: string;
  timestamp: number;
  grid: MultiEntityRow[]; // deep copy of the grid at trigger time
};

type ELStatus = {
  agreementId: string;
  accountId: string;
  contactId: string;
  congaTemplate: string;
  createdAt: number;
  createdBy: string;
  status: "Created" | "In Progress" | "Completed" | "Failed";
  myCongaELsUrl: string;
};

type OpportunityContainer = {
  id: string;
  ocName: string; // a readable label
  leadAccount: string; // the account to which this OC is attached
  renewalYear: number;
  renewalMonth: number; // 1-12
  servicesCatalog: Service[]; // possible services for this OC
  grid: MultiEntityRow[]; // First row is ALWAYS the lead account
  // Renewal pointers / flags
  renewedFromId?: string; // pointer back to source OC
  renewedToId?: string; // pointer forward to renewed OC
  // CIS state
  cisHistory: CISSnapshot[]; // history of Trigger CIS actions
  cisStage: "Not Started" | "In Progress" | "Completed";
  cisStatus: "" | "Approved" | "Failed";
  // Conga Template
  congaTemplate: "Tax CLM Template" | "A-A and RAAS Conga template" | "Consulting Conga Template";
  // EL state
  elStatus?: ELStatus;
};

type Account = {
  name: string;
  // when an account is part of another account's OC grid (non-lead), it cannot have its own OC
  includedOnly?: boolean; // informational convenience (derived from data generation)
};

// Used in the Workday rollover wizard
type RolloverProject = {
  id: string; // vetted Workday Project ID (PRJ#####)
  name: string; // Project Name (Account — Service Name)
  account: string;
  service: string; // service code
};

// ---------- Mock Data ----------
const ALL_SERVICES: Service[] = [
  { code: "409A", name: "409A Valuation" },
  { code: "ADMIN", name: "Admin" },
  { code: "GEV", name: "Gift & Estate Valuation" },
  { code: "TAX", name: "Tax Advisory" },
  { code: "AUD", name: "Audit" },
];

const ACCOUNTS: Account[] = [
  { name: "Gopi" },
  { name: "Company 30" },
  { name: "Company 60" },
  { name: "CPIF Testing" },
  { name: "Nate Test 1" },
  { name: "Acme Holdings" },
];

// Helpers
const row = (account: string, services: string[], wp: Record<string, string> = {}): MultiEntityRow => ({
  account,
  services,
  wpIds: wp,
});

const withWp = (...pairs: [string, string][]): Record<string, string> => {
  const m: Record<string, string> = {};
  pairs.forEach(([k, v]) => (m[k] = v));
  return m;
};

const INITIAL_OCS: OpportunityContainer[] = [
  {
    id: "OC-GOPI-1",
    ocName: "Gopi – Trust",
    leadAccount: "Gopi",
    renewalYear: 2025,
    renewalMonth: 1,
    servicesCatalog: ALL_SERVICES,
    // WP IDs should start blank; filled only via Manage CPIF Creation
    grid: [row("Gopi", ["GEV", "409A"])],
    cisHistory: [],
    cisStage: "Not Started",
    cisStatus: "",
    congaTemplate: "Tax CLM Template",
  },
  {
    id: "OC-GOPI-2",
    ocName: "Gopi – Advisory Bundle",
    leadAccount: "Gopi",
    renewalYear: 2025,
    renewalMonth: 6,
    servicesCatalog: ALL_SERVICES,
    grid: [
      row("Gopi", ["ADMIN", "TAX"]),
      row("Company 30", ["409A"]) 
    ],
    cisHistory: [],
    cisStage: "Not Started",
    cisStatus: "",
    congaTemplate: "A-A and RAAS Conga template",
  },
  {
    id: "OC-C60-1",
    ocName: "Company 60 – Core Services",
    leadAccount: "Company 60",
    renewalYear: 2026,
    renewalMonth: 2,
    servicesCatalog: ALL_SERVICES,
    grid: [row("Company 60", ["AUD", "TAX"])],
    cisHistory: [],
    cisStage: "Not Started",
    cisStatus: "",
    congaTemplate: "Consulting Conga Template",
  },
  {
    id: "OC-NATE-1",
    ocName: "Nate Test 1 – Starter",
    leadAccount: "Nate Test 1",
    renewalYear: 2025,
    renewalMonth: 6,
    servicesCatalog: ALL_SERVICES,
    grid: [
      row("Nate Test 1", ["409A"]),
      row("CPIF Testing", ["ADMIN"]) 
    ],
    cisHistory: [],
    cisStage: "Not Started",
    cisStatus: "",
    congaTemplate: "Tax CLM Template",
  },
  {
    id: "OC-ACME-1",
    ocName: "Acme Holdings – Premium",
    leadAccount: "Acme Holdings",
    renewalYear: 2025,
    renewalMonth: 1,
    servicesCatalog: ALL_SERVICES,
    grid: [row("Acme Holdings", ["AUD", "TAX", "ADMIN"])],
    cisHistory: [],
    cisStage: "Not Started",
    cisStatus: "",
    congaTemplate: "A-A and RAAS Conga template",
  },
  {
    id: "OC-ACME-2",
    ocName: "Acme Holdings – Valuations",
    leadAccount: "Acme Holdings",
    renewalYear: 2026,
    renewalMonth: 9,
    servicesCatalog: ALL_SERVICES,
    grid: [row("Acme Holdings", ["409A", "GEV"])],
    cisHistory: [],
    cisStage: "Not Started",
    cisStatus: "",
    congaTemplate: "Consulting Conga Template",
  },
];

// Compute which accounts are included in others' grids (non-lead)
const INCLUDED_IN_OTHERS = new Set<string>();
INITIAL_OCS.forEach((oc) => {
  oc.grid.slice(1).forEach((r) => INCLUDED_IN_OTHERS.add(r.account));
});

// Derive final account list with includedOnly flag
const ACCOUNTS_WITH_FLAGS: Account[] = ACCOUNTS.map((a) => ({
  ...a,
  includedOnly: INCLUDED_IN_OTHERS.has(a.name) && !INITIAL_OCS.some((oc) => oc.leadAccount === a.name),
}));

// Utility helpers
function monthName(m: number) {
  return new Date(2000, m - 1, 1).toLocaleString(undefined, { month: "short" });
}

function nextId(base: string, counter: number) {
  return `${base}-${counter}`;
}

function deepCopyGrid(grid: MultiEntityRow[]): MultiEntityRow[] {
  return grid.map((g) => ({ account: g.account, services: [...g.services], wpIds: { ...g.wpIds } }));
}

function pad(n: number, width = 4) {
  const s = String(n);
  return s.length >= width ? s : new Array(width - s.length + 1).join("0") + s;
}

function generateRealisticId(prefix: string, year: number): string {
  const randomNum = Math.floor(Math.random() * 9999) + 1;
  return `${prefix}-${year}-${pad(randomNum, 4)}`;
}

function validateTemplateCompatibility(template: string, services: string[]): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Tax services include TAX, GEV (Gift & Estate Valuation), and 409A
  const taxServices = ["TAX", "GEV", "409A"];
  
  if (template === "Tax CLM Template" && !services.some(s => taxServices.includes(s))) {
    warnings.push("Tax CLM Template selected but no Tax services found (TAX, GEV, 409A)");
  }
  
  if (template === "A-A and RAAS Conga template" && !services.some(s => ["409A", "ADMIN"].includes(s))) {
    warnings.push("A-A and RAAS template selected but no 409A or Admin services found");
  }
  
  if (template === "Consulting Conga Template" && !services.some(s => ["AUD", "TAX", "ADMIN"].includes(s))) {
    warnings.push("Consulting template selected but no Audit, Tax, or Admin services found");
  }
  
  return { valid: warnings.length === 0, warnings };
}

// Count selected services that do NOT yet have a WP ID
function countMissingWpIds(oc: OpportunityContainer): number {
  let missing = 0;
  oc.grid.forEach((r) => {
    r.services.forEach((svc) => {
      if (!r.wpIds[svc]) missing += 1;
    });
  });
  return missing;
}

function allSelectedHaveWp(oc: OpportunityContainer): boolean {
  return countMissingWpIds(oc) === 0;
}

function getVettedProjects(oc: OpportunityContainer) {
  const rows: RolloverProject[] = [];
  oc.grid.forEach((r) => {
    r.services.forEach((svc) => {
      const id = r.wpIds[svc];
      if (id) {
        const svcName = (oc.servicesCatalog.find((s) => s.code === svc)?.name) || svc;
        rows.push({ id, name: `${r.account} — ${svcName}`, account: r.account, service: svc });
      }
    });
  });
  return rows;
}

// ---------- UI Building Blocks ----------
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{children}</span>
  );
}

function Badge({ children, tone = "default" as "default" | "green" | "amber" | "blue" | "red" }: { children: React.ReactNode; tone?: "default" | "green" | "amber" | "blue" | "red" }) {
  const toneClasses =
    tone === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : tone === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : tone === "red"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-gray-50 text-gray-600 border-gray-200";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${toneClasses}`}>{children}</span>;
}

function ClickableBadge({ children, tone = "default" as "default" | "green" | "amber" | "blue" | "red", onClick }: { children: React.ReactNode; tone?: "default" | "green" | "amber" | "blue" | "red"; onClick?: () => void }) {
  const toneClasses =
    tone === "green"
      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
      : tone === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
      : tone === "red"
      ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100";
  return (
    <button 
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs cursor-pointer transition-colors ${toneClasses}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="inline-flex items-center gap-1">
      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
      <span className="text-xs">Creating...</span>
    </div>
  );
}

function CongaStatusIndicator({ status, lastSync }: { status: "Connected" | "Disconnected" | "Syncing"; lastSync: number }) {
  const [timeString, setTimeString] = useState('');
  
  useEffect(() => {
    // Only render time on client side to avoid hydration mismatch
    setTimeString(new Date(lastSync).toLocaleTimeString());
  }, [lastSync]);
  
  const getStatusColor = () => {
    switch (status) {
      case "Connected": return "text-green-600";
      case "Disconnected": return "text-red-600";
      case "Syncing": return "text-blue-600";
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case "Connected": return "🟢";
      case "Disconnected": return "🔴";
      case "Syncing": return "🔄";
    }
  };
  
  return (
    <div className="flex items-center gap-1 text-xs">
      <span>{getStatusIcon()}</span>
      <span className={getStatusColor()}>CONGA CLM {status}</span>
      <span className="text-gray-500">• Last sync: {timeString || 'Loading...'}</span>
    </div>
  );
}

function Modal({ open, onClose, title, children, size = "md" as "md" | "lg" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "md" | "lg" }) {
  if (!open) return null;
  const containerClass =
    size === "lg"
      ? "relative max-h-[90vh] w-[1200px] overflow-auto rounded-2xl bg-white p-6 shadow-xl"
      : "relative max-h-[85vh] w-[980px] overflow-auto rounded-2xl bg-white p-6 shadow-xl";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={containerClass}>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="rounded-xl border px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Read-only grid for View details — shows Service + Workday Project ID per account row
function ViewGrid({ oc }: { oc: OpportunityContainer }) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Lead Account: <b>{oc.leadAccount}</b> • Renewal: <b>{monthName(oc.renewalMonth)} {oc.renewalYear}</b>
        {oc.renewedFromId && (
          <span className="ml-2"><Badge tone="blue">Renewed from: {oc.renewedFromId}</Badge></span>
        )}
        {oc.renewedToId && (
          <span className="ml-2"><Badge tone="green">Renewed to: {oc.renewedToId}</Badge></span>
        )}
      </div>
      <div className="text-sm">
        <Badge tone={oc.cisStage === "Completed" ? (oc.cisStatus === "Approved" ? "green" : oc.cisStatus === "Failed" ? "red" : "amber") : "amber"}>
          CIS Stage: {oc.cisStage}
        </Badge>
        {" "}
        {oc.cisStatus && <Badge tone={oc.cisStatus === "Approved" ? "green" : "red"}>CIS Status: {oc.cisStatus}</Badge>}
      </div>
      <table className="w-full table-auto border-collapse overflow-hidden rounded-xl">
        <thead>
          <tr className="bg-gray-50 text-left text-sm">
            <th className="border px-3 py-2">Account</th>
            <th className="border px-3 py-2">Service</th>
            <th className="border px-3 py-2">Workday Project ID</th>
          </tr>
        </thead>
        <tbody>
          {oc.grid.map((r, idx) => (
            r.services.map((svc, j) => (
              <tr key={`${idx}-${svc}-${j}`} className={idx === 0 ? "bg-amber-50" : "bg-white"}>
                <td className="border px-3 py-2">{r.account}{idx === 0 && <Chip>Lead</Chip>}</td>
                <td className="border px-3 py-2">{svc}</td>
                <td className="border px-3 py-2">{r.wpIds[svc] || "—"}</td>
              </tr>
            ))
          ))}
        </tbody>
      </table>
      <div className="text-xs text-gray-500">First row is always the lead account attached to this OC.</div>
    </div>
  );
}

// Editable grid for services (WP ID is read-only). Includes a CIS trigger with snapshot history and detailed viewer.
function EditGrid({
  oc,
  onTriggerCIS,
  onCompleteCIS,
}: {
  oc: OpportunityContainer;
  onTriggerCIS: (updatedGrid: MultiEntityRow[]) => void;
  onCompleteCIS: (status: "Approved" | "Failed") => void;
}) {
  const [draft, setDraft] = useState<MultiEntityRow[]>(deepCopyGrid(oc.grid));

  function toggleService(account: string, svc: string) {
    setDraft((prev) =>
      prev.map((r) => {
        if (r.account !== account) return r;
        const selected = new Set(r.services);
        if (selected.has(svc)) selected.delete(svc); else selected.add(svc);
        // Keep wpIds untouched (read-only) even if service unchecked
        return { ...r, services: Array.from(selected), wpIds: { ...r.wpIds } };
      })
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Badge tone={oc.cisStage === "Completed" ? (oc.cisStatus === "Approved" ? "green" : oc.cisStatus === "Failed" ? "red" : "amber") : "amber"}>
          CIS Stage: {oc.cisStage}
        </Badge>
        {oc.cisStatus && <Badge tone={oc.cisStatus === "Approved" ? "green" : "red"}>CIS Status: {oc.cisStatus}</Badge>}
      </div>

      {draft.map((r, idx) => (
        <div key={r.account} className="rounded-xl border">
          <div className={`flex items-center justify-between rounded-t-xl px-4 py-2 ${idx === 0 ? "bg-amber-50" : "bg-gray-50"}`}>
            <div className="text-sm font-medium">{r.account} {idx === 0 && <Badge tone="amber">Lead</Badge>}</div>
          </div>
          <div className="p-4">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left text-sm">
                  <th className="border px-3 py-2">Select</th>
                  <th className="border px-3 py-2">Service</th>
                  <th className="border px-3 py-2">Workday Project ID (read-only)</th>
                </tr>
              </thead>
              <tbody>
                {oc.servicesCatalog.map((svc) => {
                  const checked = r.services.includes(svc.code);
                  return (
                    <tr key={svc.code}>
                      <td className="border px-3 py-2">
                        <input type="checkbox" checked={checked} onChange={() => toggleService(r.account, svc.code)} />
                      </td>
                      <td className="border px-3 py-2">{svc.code} — {svc.name}</td>
                      <td className="border px-3 py-2">
                        <span className="inline-block rounded-md bg-gray-50 px-2 py-1 text-sm text-gray-700 border">
                          {r.wpIds[svc.code] || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600">Review selections, then trigger CIS to capture a timestamped snapshot or simulate completion.</div>
        <div className="flex gap-2">
          <button className="rounded-xl bg-amber-500 px-4 py-2 text-white hover:bg-amber-600" onClick={() => onTriggerCIS(draft)}>
            Trigger CIS
          </button>
          <button className="rounded-xl bg-amber-500 px-3 py-2 text-white hover:bg-amber-600 text-sm disabled:opacity-40" disabled={oc.cisHistory.length === 0} title={oc.cisHistory.length === 0 ? "Trigger CIS at least once to enable" : "Mark CIS Completed (Approved)"} onClick={() => onCompleteCIS("Approved")}>
            Simulate CIS Completed with Approval
          </button>
          <button className="rounded-xl bg-amber-500 px-3 py-2 text-white hover:bg-amber-600 text-sm disabled:opacity-40" disabled={oc.cisHistory.length === 0} title={oc.cisHistory.length === 0 ? "Trigger CIS at least once to enable" : "Mark CIS Completed (Failed)"} onClick={() => onCompleteCIS("Failed")}>
            Simulate CIS Completed with Failure
          </button>
        </div>
      </div>

      {oc.cisHistory.length > 0 && (
        <div className="rounded-xl border p-4">
          <div className="mb-2 text-sm font-medium">Past Trigger History</div>
          <ul className="space-y-2 text-sm">
            {oc.cisHistory.map((h) => (
              <li key={h.id} className="rounded-lg border p-2">
                <details>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-600">{new Date(h.timestamp).toLocaleString()} • Snapshot {h.id}</div>
                        <div>{h.grid.length} account row(s), {h.grid.reduce((acc, r) => acc + r.services.length, 0)} service selections</div>
                      </div>
                      <span className="text-xs text-gray-500">View snapshot</span>
                    </div>
                  </summary>
                  <div className="mt-3 overflow-auto">
                    <table className="w-full table-auto border-collapse">
                      <thead>
                        <tr className="text-left text-sm">
                          <th className="border px-3 py-2">Account</th>
                          <th className="border px-3 py-2">Service</th>
                          <th className="border px-3 py-2">Workday Project ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {h.grid.map((r, idx) => (
                          r.services.map((svc) => (
                            <tr key={`${h.id}-${idx}-${svc}`}>
                              <td className="border px-3 py-2">{r.account}{idx === 0 && <Chip>Lead</Chip>}</td>
                              <td className="border px-3 py-2">{svc}</td>
                              <td className="border px-3 py-2">{r.wpIds[svc] || "—"}</td>
                            </tr>
                          ))
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// CPIF creation view (like Edit) with per-service "Manage CPIF Creation" actions
function CPIFGrid({
  oc,
  onCreateCPIF,
  onClose,
}: {
  oc: OpportunityContainer;
  onCreateCPIF: (account: string, serviceCode: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<MultiEntityRow[]>(deepCopyGrid(oc.grid));

  // Keep the popup in sync with the latest OC changes so WP IDs appear immediately
  useEffect(() => {
    setDraft(deepCopyGrid(oc.grid));
  }, [oc]);

  function toggleService(account: string, svc: string) {
    setDraft((prev) =>
      prev.map((r) => {
        if (r.account !== account) return r;
        const selected = new Set(r.services);
        if (selected.has(svc)) selected.delete(svc); else selected.add(svc);
        return { ...r, services: Array.from(selected), wpIds: { ...r.wpIds } };
      })
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Badge tone={oc.cisStage === "Completed" ? (oc.cisStatus === "Approved" ? "green" : oc.cisStatus === "Failed" ? "red" : "amber") : "amber"}>
          CIS Stage: {oc.cisStage}
        </Badge>
        {oc.cisStatus && <Badge tone={oc.cisStatus === "Approved" ? "green" : "red"}>CIS Status: {oc.cisStatus}</Badge>}
      </div>

      {draft.map((r, idx) => (
        <div key={r.account} className="rounded-xl border">
          <div className={`flex items-center justify-between rounded-t-xl px-4 py-2 ${idx === 0 ? "bg-amber-50" : "bg-gray-50"}`}>
            <div className="text-sm font-medium">{r.account} {idx === 0 && <Badge tone="amber">Lead</Badge>}</div>
          </div>
          <div className="p-4">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left text-sm">
                  <th className="border px-3 py-2">Selected</th>
                  <th className="border px-3 py-2">Service</th>
                  <th className="border px-3 py-2">Workday Project ID</th>
                  <th className="border px-3 py-2">Create CPIF</th>
                </tr>
              </thead>
              <tbody>
                {oc.servicesCatalog.map((svc) => {
                  const checked = r.services.includes(svc.code);
                  const hasId = !!r.wpIds[svc.code];
                  return (
                    <tr key={svc.code}>
                      <td className="border px-3 py-2">
                        <input type="checkbox" checked={checked} onChange={() => toggleService(r.account, svc.code)} />
                      </td>
                      <td className="border px-3 py-2">{svc.code} — {svc.name}</td>
                      <td className="border px-3 py-2">
                        <span className="inline-block rounded-md bg-gray-50 px-2 py-1 text-sm text-gray-700 border">
                          {r.wpIds[svc.code] || "—"}
                        </span>
                      </td>
                      <td className="border px-3 py-2">
                        <button
                          className="rounded-xl bg-amber-500 px-3 py-1.5 text-white hover:bg-amber-600 text-sm disabled:opacity-40"
                          disabled={!checked || hasId}
                          onClick={() => onCreateCPIF(r.account, svc.code)}
                        >
                          Create CPIF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div className="text-xs text-gray-500">Tip: The Manage CPIF Creation button is enabled only for services that are selected and don't already have a Workday Project ID.</div>
    </div>
  );
}

// Small component to list vetted projects from a source OC
function RolloverList({ source }: { source: OpportunityContainer }) {
  const projects = getVettedProjects(source);
  if (projects.length === 0) {
    return <div className="text-sm text-gray-500">No vetted Workday Projects found in source container ({source.id}).</div>;
  }
  return (
    <div className="space-y-3">
      <div className="text-sm">Source: <b>{source.id}</b> — {source.ocName}</div>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="text-left text-sm">
            <th className="border px-3 py-2">Account</th>
            <th className="border px-3 py-2">Service</th>
            <th className="border px-3 py-2">Vetted Workday Project IDs</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p, i) => (
            <tr key={i}>
              <td className="border px-3 py-2">{p.account}</td>
              <td className="border px-3 py-2">{p.service}</td>
              <td className="border px-3 py-2">{p.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-xs text-gray-500">These are vetted projects created in the source container prior to renewal.</div>
    </div>
  );
}

// ---------- Rollover Wizard ----------
function RolloverWizard({ source }: { source: OpportunityContainer }) {
  const projects = useMemo(() => getVettedProjects(source), [source]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<Set<string>>(new Set(projects.map((p) => p.id)));
  const [copyAll1, setCopyAll1] = useState<boolean>(true);

  // Attributes step
  const [copyAll2, setCopyAll2] = useState<boolean>(false);
  const [attrs, setAttrs] = useState({
    project: true,
    resourceForecast: true,
    roles: false,
    attachContract: false,
    projectDates: "Original Project Dates",
    contract: "Do Not Roll",
  });

  // Processing
  const [progress, setProgress] = useState<number>(20);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function viewRow(pId: string) {
    const p = projects.find((x) => x.id === pId);
    if (!p) return;
    alert(`${p.name}
Project ID: ${p.id}`);
  }

  function proceedFromStep1() {
    if (selected.size === 0) return;
    setStep(2);
  }

  function startBulk() {
    setStep(3);
    setProgress(20);
  }

  function refreshProgress() {
    setProgress((pr) => Math.min(100, pr + 20));
  }

  return (
    <div className="space-y-5">
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Bulk Attribute Selection</h3>
          <div className="rounded-xl border">
            <div className="flex items-center justify-between px-3 py-2 text-sm text-gray-600">
              <div>{projects.length} item{projects.length === 1 ? '' : 's'}</div>
            </div>
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left text-sm">
                  <th className="border px-3 py-2 w-10"></th>
                  <th className="border px-3 py-2">Project ID</th>
                  <th className="border px-3 py-2">Project Name</th>
                  <th className="border px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td className="border px-3 py-2"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} /></td>
                    <td className="border px-3 py-2">{p.id}</td>
                    <td className="border px-3 py-2">{p.name}</td>
                    <td className="border px-3 py-2">
                      <button className="rounded-xl border px-3 py-1 text-sm" onClick={() => viewRow(p.id)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <input id="copyAll1" type="checkbox" checked={copyAll1} onChange={(e) => setCopyAll1(e.target.checked)} />
            <label htmlFor="copyAll1" className="text-sm">Copy All Attributes</label>
          </div>

          {copyAll2 && (
            <div className="text-xs text-gray-500">Copy All Attributes is checked — individual selections are disabled. Uncheck to pick specific attributes.</div>
          )}

          <div className="flex justify-end gap-2">
            <button className="rounded-xl border px-4 py-2" onClick={() => setStep(1)} disabled>Back</button>
            <button className="rounded-xl bg-amber-500 px-4 py-2 text-white disabled:opacity-40" disabled={selected.size === 0} onClick={proceedFromStep1}>Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input id="copyAll2" type="checkbox" checked={copyAll2} onChange={(e) => setCopyAll2(e.target.checked)} />
            <label htmlFor="copyAll2" className="text-sm">Copy All Attributes</label>
          </div>

          <h4 className="text-base font-semibold">Select Attributes</h4>

          <div className={`space-y-3 ${copyAll2 ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex items-center gap-2"><input type="checkbox" checked={attrs.project} onChange={(e) => setAttrs({ ...attrs, project: e.target.checked })} /><span className="text-sm">Project</span></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={attrs.resourceForecast} onChange={(e) => setAttrs({ ...attrs, resourceForecast: e.target.checked })} /><span className="text-sm">Resource Forecast</span></div>

            <div className="grid max-w-md grid-cols-2 gap-3">
              <label className="text-sm self-center">Project Dates</label>
              <select className="rounded-xl border px-3 py-2" value={attrs.projectDates} onChange={(e) => setAttrs({ ...attrs, projectDates: e.target.value })}>
                <option>Original Project Dates</option>
                <option>Shift to Renewal Month/Year</option>
              </select>

              <label className="text-sm self-center">Roles</label>
              <div className="self-center"><input type="checkbox" checked={attrs.roles} onChange={(e) => setAttrs({ ...attrs, roles: e.target.checked })} /></div>

              <label className="text-sm self-center">Contract</label>
              <select className="rounded-xl border px-3 py-2" value={attrs.contract} onChange={(e) => setAttrs({ ...attrs, contract: e.target.value })}>
                <option>Do Not Roll</option>
                <option>Roll Current Contract</option>
              </select>

              <label className="text-sm self-center">Attach Contract to Billing Schedule</label>
              <div className="self-center"><input type="checkbox" checked={attrs.attachContract} onChange={(e) => setAttrs({ ...attrs, attachContract: e.target.checked })} /></div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button className="rounded-xl border px-4 py-2" onClick={() => setStep(1)}>Back</button>
            <button className="rounded-xl bg-amber-500 px-4 py-2 text-white" onClick={startBulk}>Start Bulk Rollover</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Bulk Process Initiated</h3>
          <div className="text-sm"><b>Message:</b> Your request has been submitted and is now processing. Click the refresh button to get status updates.</div>
          <div className="text-sm"><b>Status:</b> {progress < 100 ? 'Processing' : 'Completed'}</div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-3 bg-amber-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-center text-xs text-gray-600">{progress}%</div>
          <div>
            <button className="rounded-xl border px-4 py-2" onClick={refreshProgress} disabled={progress >= 100}>Refresh</button>
          </div>
          <div className="pt-4 text-center text-xs text-gray-500">Powered by Workday Extend</div>
        </div>
      )}
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [ocs, setOcs] = useState<OpportunityContainer[]>(INITIAL_OCS);
  const [filterAccount, setFilterAccount] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [onlyRenewable, setOnlyRenewable] = useState<boolean>(false); // show only OCs that can be renewed
  const [applied, setApplied] = useState(false);
  const [viewing, setViewing] = useState<OpportunityContainer | null>(null);
  const [editing, setEditing] = useState<OpportunityContainer | null>(null);
  const [cpifEditing, setCpifEditing] = useState<OpportunityContainer | null>(null);
  const [rolloverOC, setRolloverOC] = useState<OpportunityContainer | null>(null);
  const [originatingOC, setOriginatingOC] = useState<OpportunityContainer | null>(null);
  const [renewCounter, setRenewCounter] = useState(1);
  const [cisCounter, setCisCounter] = useState(1);
  const [cpifCounter, setCpifCounter] = useState(1);
  const [elLinks, setElLinks] = useState<Record<string, string>>({}); // Store EL links by OC ID
  const [elLoading, setElLoading] = useState<Record<string, boolean>>({}); // Track EL creation loading states
  const [congaLMStatus, setCongaLMStatus] = useState<"Connected" | "Disconnected" | "Syncing">("Connected");
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [elSuccess, setElSuccess] = useState<null | { ocId: string; data: ELStatus; warnings: string[] }>(null);
  const [showContainerWizard, setShowContainerWizard] = useState(false);
  const [showExcelGrid, setShowExcelGrid] = useState(false);
  const [currentOCId, setCurrentOCId] = useState<string | null>(null); // Track which OC the wizard is for
  const [savedCPIFs, setSavedCPIFs] = useState<Record<string, boolean>>({});
  const [wizardRowsCount, setWizardRowsCount] = useState<Record<string, number>>({}); // Track which OCs have saved CPIFs

  const accountOptions = useMemo(() => {
    const names = new Set<string>();
    ocs.forEach((oc) => names.add(oc.leadAccount));
    ACCOUNTS_WITH_FLAGS.forEach((a) => names.add(a.name));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [ocs]);

  function canRenew(oc: OpportunityContainer) {
    // Renew is enabled only if this OC hasn't been renewed yet AND CIS Stage is Completed
    return !oc.renewedToId && oc.cisStage === "Completed";
  }

  function canCreateCPIF(oc: OpportunityContainer) {
    // Enabled only if CIS completed & approved AND there exists at least one selected service without a WP ID
    return oc.cisStage === "Completed" && oc.cisStatus === "Approved" && countMissingWpIds(oc) > 0;
  }

  function canContinueRollover(oc: OpportunityContainer) {
    // Only for renewed OCs, after CIS Completed & Approved
    return !!oc.renewedFromId && oc.cisStage === "Completed" && oc.cisStatus === "Approved";
  }

  function canCreateEL(oc: OpportunityContainer) {
    // Enabled only if CIS completed & approved AND no existing EL
    return oc.cisStage === "Completed" && oc.cisStatus === "Approved" && !oc.elStatus;
  }

  const loadWizardRowsCount = async () => {
    try {
      const response = await fetch('/api/cpif');
      if (response.ok) {
        const result = await response.json();
        const rows = result.data || [];
        
        // Count rows per OC (using the actual OC ID from the wizard data)
        const countByOC: Record<string, number> = {};
        rows.forEach((row: any) => {
          // Use the ocId field from the wizard row
          if (row.ocId) {
            countByOC[row.ocId] = (countByOC[row.ocId] || 0) + 1;
          }
        });
        
        console.log('Wizard rows count by OC:', countByOC);
        console.log('Available OCs:', ocs.map(oc => ({ id: oc.id, name: oc.ocName })));
        setWizardRowsCount(countByOC);
      }
    } catch (error) {
      console.error('Failed to load wizard rows count:', error);
    }
  };

  // Load wizard rows count on component mount
  useEffect(() => {
    loadWizardRowsCount();
  }, []);

  // Function to check if an OC has existing wizard rows
  const hasWizardRows = (ocId: string): boolean => {
    const count = wizardRowsCount[ocId] || 0;
    console.log(`Checking wizard rows for OC ${ocId}: ${count} rows`);
    return count > 0;
  };

  function canDeleteEL(oc: OpportunityContainer) {
    // Can delete if EL exists
    return !!oc.elStatus;
  }

  async function createEL(oc: OpportunityContainer) {
    if (!canCreateEL(oc)) return;
    
    // Set loading state
    setElLoading(prev => ({ ...prev, [oc.id]: true }));
    setCongaLMStatus("Syncing");
    
    try {
      // Validate template compatibility
      const services = oc.grid.flatMap(row => row.services);
      const validation = validateTemplateCompatibility(oc.congaTemplate, services);
      
      // Simulate API call delay with progress
      await new Promise(resolve => setTimeout(resolve, 800)); // Account creation
      await new Promise(resolve => setTimeout(resolve, 500)); // Contact creation  
      await new Promise(resolve => setTimeout(resolve, 700)); // Agreement creation
      
      // Generate realistic IDs
      const agreementId = generateRealisticId("AGR", oc.renewalYear);
      const accountId = generateRealisticId("ACC", oc.renewalYear);
      const contactId = generateRealisticId("CON", oc.renewalYear);
      
      const myCongaELsUrl = `https://armanino--armdev.sandbox.lightning.force.com/lightning/o/Agreement__c/list?filterName=My_ELs&ocId=${encodeURIComponent(oc.id)}&leadAccount=${encodeURIComponent(oc.leadAccount)}&template=${encodeURIComponent(oc.congaTemplate)}&agreementId=${agreementId}`;
      
      // Create EL status object
      const elStatus: ELStatus = {
        agreementId,
        accountId,
        contactId,
        congaTemplate: oc.congaTemplate,
        createdAt: Date.now(),
        createdBy: "Current User", // In real app, get from auth context
        status: "Created",
        myCongaELsUrl
      };
      
      // Update OC with EL status
      setOcs(prev => prev.map(p => p.id === oc.id ? { ...p, elStatus } : p));
      
      // Store the EL link for this OC
      setElLinks(prev => ({
        ...prev,
        [oc.id]: myCongaELsUrl
      }));
      
      // Update sync status
      setCongaLMStatus("Connected");
      setLastSyncTime(Date.now());
      
      // Open success modal instead of alert
      setElSuccess({ ocId: oc.id, data: elStatus, warnings: validation.warnings });
      
    } catch (error) {
      console.error('Error creating EL:', error);
      setCongaLMStatus("Disconnected");
      alert(`❌ Error creating EL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clear loading state
      setElLoading(prev => ({ ...prev, [oc.id]: false }));
    }
  }

  async function deleteEL(oc: OpportunityContainer) {
    if (!canDeleteEL(oc)) return;
    
    const confirmed = confirm(
      `Are you sure you want to delete the EL for ${oc.ocName}?\n\n` +
      `Agreement ID: ${oc.elStatus?.agreementId}\n` +
      `Template: ${oc.elStatus?.congaTemplate}\n\n` +
      `This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove EL status from OC
      setOcs(prev => prev.map(p => p.id === oc.id ? { ...p, elStatus: undefined } : p));
      
      // Remove EL link
      setElLinks(prev => {
        const newLinks = { ...prev };
        delete newLinks[oc.id];
        return newLinks;
      });
      
      // Update sync status
      setLastSyncTime(Date.now());
      
      alert(`✅ EL deleted successfully for ${oc.ocName}`);
      
    } catch (error) {
      console.error('Error deleting EL:', error);
      alert(`❌ Error deleting EL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const filtered = useMemo(() => {
    if (!applied) return [] as OpportunityContainer[]; // right pane empty before Apply
    return ocs.filter((oc) => {
      const matchAcc = !filterAccount || oc.leadAccount === filterAccount;
      const matchYear = !filterYear || oc.renewalYear === Number(filterYear);
      const matchMonth = !filterMonth || oc.renewalMonth === Number(filterMonth);
      const eligible = !onlyRenewable || canRenew(oc);
      return matchAcc && matchYear && matchMonth && eligible;
    });
  }, [ocs, filterAccount, filterYear, filterMonth, onlyRenewable, applied]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setApplied(true);
  }

  function clearFilters() {
    setFilterAccount("");
    setFilterYear("");
    setFilterMonth("");
    setOnlyRenewable(false);
    setApplied(false); // reset to show empty right pane
  }

  function renew(oc: OpportunityContainer) {
    if (!canRenew(oc)) return; // safety: only renew when enabled
    const newOc: OpportunityContainer = {
      ...oc,
      id: nextId(oc.id + "-REN", renewCounter),
      renewalYear: oc.renewalYear + 1,
      // On renewal, copy services but clear all Workday Project IDs for the new OC
      grid: oc.grid.map((r) => ({ account: r.account, services: [...r.services], wpIds: {} })),
      
      ocName: oc.ocName + " (Renewed)",
      renewedFromId: oc.id,
      renewedToId: undefined,
      cisHistory: [], // fresh OC starts with no history
      cisStage: "Not Started",
      cisStatus: "",
      congaTemplate: oc.congaTemplate, // copy the conga template
    };
    setRenewCounter((c) => c + 1);
    // mark pointer on the source OC and add the new OC
    setOcs((prev) => prev.map((p) => (p.id === oc.id ? { ...p, renewedToId: newOc.id } : p)).concat(newOc));
  }

  function triggerCIS(onOc: OpportunityContainer, updatedGrid: MultiEntityRow[]) {
    const snapshot: CISSnapshot = {
      id: `CIS-${cisCounter}`,
      timestamp: Date.now(),
      grid: deepCopyGrid(updatedGrid),
    };
    setCisCounter((c) => c + 1);
    // persist updated grid, push history, set CIS Stage to In Progress
    setOcs((prev) => {
      const updatedList = prev.map((p) =>
        p.id === onOc.id
          ? { ...p, grid: deepCopyGrid(updatedGrid), cisHistory: [snapshot, ...p.cisHistory], cisStage: "In Progress" as const, cisStatus: "" as const }
          : p
      );
      const fresh = updatedList.find((p) => p.id === onOc.id) || null;
      if (fresh) setEditing(fresh);
      return updatedList;
    });
  }

  function completeCIS(onOc: OpportunityContainer, status: "Approved" | "Failed") {
    setOcs((prev) => {
      const updatedList = prev.map((p) =>
        p.id === onOc.id ? { ...p, cisStage: "Completed" as const, cisStatus: status } : p
      );
      const fresh = updatedList.find((p) => p.id === onOc.id) || null;
      if (fresh) setEditing(fresh);
      return updatedList;
    });
  }

  function deleteOC(ocId: string) {
    setOcs((prev) => prev.filter((p) => p.id !== ocId));
  }

  function createCPIF(onOc: OpportunityContainer, account: string, serviceCode: string) {
    const rand = Math.floor(Math.random() * 100000);
    const newId = `PRJ${String(rand).padStart(5, '0')}`;
    setCpifCounter((c) => c + 1);
    setOcs((prev) => {
      const updatedList = prev.map((p) => {
        if (p.id !== onOc.id) return p;
        return {
          ...p,
          grid: p.grid.map((row) => {
            if (row.account !== account) return row;
            if (row.services.includes(serviceCode) && !row.wpIds[serviceCode]) {
              return { ...row, wpIds: { ...row.wpIds, [serviceCode]: newId } };
            }
            return row;
          }),
        };
      });
      const fresh = updatedList.find((x) => x.id === onOc.id) || null;
      if (fresh) setCpifEditing(fresh);
      return updatedList;
    });
  }

  // years and months present in data (for convenience)
  const yearOptions = Array.from(new Set(ocs.map((o) => o.renewalYear))).sort((a, b) => a - b);
  const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[340px,1fr]">
        {/* Left filter column */}
        <div className="flex h-screen flex-col rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">Filter & Select Container to Roll</h2>
                  </div>
          <form onSubmit={applyFilters} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm">Customer</label>
              <select className="w-full rounded-xl border px-3 py-2" value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}>
                <option value="">All</option>
                {accountOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm">Renewal Year</label>
                <select className="w-full rounded-xl border px-3 py-2" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                  <option value="">All</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">Renewal Month</label>
                <select className="w-full rounded-xl border px-3 py-2" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                  <option value="">All</option>
                  {monthOptions.map((m) => (
                    <option key={m} value={String(m)}>{monthName(m)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input id="onlyRenew" type="checkbox" checked={onlyRenewable} onChange={(e) => setOnlyRenewable(e.target.checked)} />
              <label htmlFor="onlyRenew" className="text-sm">Show only OCs that can be renewed</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="rounded-2xl bg-amber-500 px-4 py-2 text-white shadow hover:bg-amber-600">Apply</button>
              <button type="button" className="rounded-2xl border px-4 py-2" onClick={clearFilters}>Clear</button>
            </div>
            <div className="pt-3 text-xs text-gray-500">Right pane starts empty. Click <b>Apply</b> to load matching OCs.</div>
          </form>

          {/* Legend / notes */}
          <div className="mt-6 flex-1 overflow-y-auto rounded-xl border p-3 text-xs text-gray-600">
            <div className="mb-1 font-medium">Business Rules encoded:</div>
            <ul className="list-disc space-y-1 pl-5">
              <li>An account can have multiple OCs, but if an account is included in another account's OC grid (non‑lead), it cannot have its own OC.</li>
              <li>First row in each Multi‑Entity grid is always the Lead Account.</li>
              <li>Renew duplicates the OC for the same account with Renewal Year incremented and links pointers in both directions.</li>
              <li>On renewal, all Workday Project IDs in the renewed OC are cleared in the new OC.</li>
              <li>Trigger CIS stores a timestamped snapshot of the current grid in the OC's history (expand any item to view details).</li>
              <li><b>CIS Stage/CIS Status</b>: Not Started → In Progress (on Trigger) → Completed (Approved/Failed via Simulate buttons).</li>
              <li>Renew is enabled only when <b>CIS Stage = Completed</b>. If CIS Stage is Not Started or In Progress, Renew is disabled.</li>
              <li>When CIS Stage is Completed, the <b>Edit</b> button is disabled.</li>
              <li><b>Create EL</b> is enabled only when <b>CIS Stage = Completed</b>, <b>CIS Status = Approved</b>, and <b>no existing EL</b>. When clicked, it simulates a successful API call to CONGA CLM that creates Account, Contact and Agreement Objects using the selected Conga Template. After successful creation, the "Create EL" button is replaced with a "My Conga ELs" link and a delete button.</li>
              <li><b>EL Deletion</b>: If an EL already exists for a container, it must be deleted before a new one can be created. The delete button (🗑️) appears next to the "My Conga ELs" link.</li>
              <li><b>Conga Template</b> can be selected at the OC level from: "Tax CLM Template", "A-A and RAAS Conga template", or "Consulting Conga Template". Template compatibility warnings are shown if the selected template doesn't match the services.</li>
              <li><b>EL Status Tracking</b>: Created ELs show Agreement ID and creation date in the OC card. The system tracks Account ID, Contact ID, Agreement ID, creation timestamp, and creator information.</li>
              <li><b>CONGA CLM Integration Status</b>: Shows connection status (Connected/Disconnected/Syncing) and last sync time in the header.</li>
              <li><b>Loading States</b>: Shows spinner and "Creating..." text during EL creation process, with realistic API call simulation (Account → Contact → Agreement creation).</li>
              <li><b>Enhanced Error Handling</b>: Simulates network timeouts, API errors, and provides detailed error messages with retry options.</li>
              <li><b>Manage CPIF Creation</b> is enabled only when <b>CIS Stage = Completed</b> and <b>CIS Status = Approved</b>, <i>and</i> at least one selected service does not have a Workday Project ID.</li>
              <li>EL Creation and CPIF Creation can progress in parallel.</li>
              <li>Renewed OCs hide the <b>Manage CPIF Creation</b> button.</li>
              <li>For renewed OCs with <b>CIS Stage = Completed</b> and <b>CIS Status = Approved</b>, a <b>Continue Rollover Process in Workday</b> button appears; clicking it lists vetted Workday Projects from the source container.</li>
              <li><b>Simulate CIS</b> buttons are enabled only after at least one <b>Trigger CIS</b> event for that OC.</li>
            </ul>
          </div>
        </div>

        {/* Right results column */}
        <div className="flex h-screen flex-col rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Matching OCs</h2>
              <CongaStatusIndicator status={congaLMStatus} lastSync={lastSyncTime} />
            </div>
            {applied && <span className="text-sm text-gray-500">{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!applied ? (
              <div className="text-sm text-gray-500">Apply a filter to see results.</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-500">No OCs match the selected filters.</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((oc) => {
                  const showDelete = canRenew(oc) && oc.cisHistory.length === 0; // show trash only if Renew enabled AND no CIS history
                  return (
                    <div key={oc.id} className="rounded-2xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500">{oc.id}</div>
                          <div className="text-base font-medium flex items-center gap-2">{oc.ocName}
                            {oc.renewedFromId && (
                              <ClickableBadge 
                                tone="blue" 
                                onClick={() => {
                                  const source = ocs.find((o) => o.id === oc.renewedFromId);
                                  if (source) setOriginatingOC(source);
                                }}
                              >
                                from {oc.renewedFromId}
                              </ClickableBadge>
                            )}
                            {oc.renewedToId && <Badge tone="green">renewed → {oc.renewedToId}</Badge>}
                            {elLoading[oc.id] ? (
                              <div className="ml-3 rounded-xl bg-blue-500 px-3 py-1.5 text-xs text-white inline-flex items-center gap-1">
                                <LoadingSpinner />
                              </div>
                            ) : oc.elStatus ? (
                              <div className="ml-3 flex items-center gap-1">
                                <a
                                  href={oc.elStatus.myCongaELsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-xl bg-green-500 px-3 py-1.5 text-xs text-white hover:bg-green-600 inline-flex items-center gap-1"
                                  title="Open My Conga ELs page"
                                >
                                  📄 My Conga ELs
                                </a>
                                <button
                                  className="rounded-xl bg-red-500 px-2 py-1.5 text-xs text-white hover:bg-red-600"
                                  onClick={() => deleteEL(oc)}
                                  title="Delete EL"
                                >
                                  🗑️
                                </button>
                              </div>
                            ) : (
                              <button
                                className="ml-3 rounded-xl bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600 disabled:opacity-40"
                                onClick={() => createEL(oc)}
                                disabled={!canCreateEL(oc)}
                                title={!canCreateEL(oc) ? "Create EL requires CIS Completed & Approved and no existing EL" : "Create EL"}
                              >
                                Create EL
                              </button>
                            )}
                            <button
                              className="ml-2 rounded-xl bg-amber-500 px-3 py-1.5 text-xs text-white hover:bg-amber-600 disabled:opacity-40"
                              onClick={() => renew(oc)}
                              disabled={!canRenew(oc)}
                            >
                              Renew
                            </button>
                            <button
                              className="ml-2 rounded-xl bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600"
                              onClick={() => {
                                setCurrentOCId(oc.id);
                                setShowContainerWizard(true);
                              }}
                              title={hasWizardRows(oc.id) ? "Manage Container Wizard" : "Create Container Wizard"}
                            >
                              {hasWizardRows(oc.id) ? "Manage Container Wizard" : "Create Container Wizard"}
                            </button>
                            <button
                              className="ml-2 rounded-xl bg-purple-500 px-3 py-1.5 text-xs text-white hover:bg-purple-600"
                              onClick={() => {
                                setCurrentOCId(oc.id);
                                setShowExcelGrid(true);
                              }}
                              title="Excel Grid View - Edit all wizard data in spreadsheet format"
                            >
                              Excel Grid View
                            </button>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <span>Lead: <b>{oc.leadAccount}</b> • Renewal: {monthName(oc.renewalMonth)} {oc.renewalYear}</span>
                            <Badge tone={oc.cisStage === "Completed" ? (oc.cisStatus === "Approved" ? "green" : oc.cisStatus === "Failed" ? "red" : "amber") : "amber"}>CIS Stage: {oc.cisStage}</Badge>
                            {oc.cisStatus && <Badge tone={oc.cisStatus === "Approved" ? "green" : "red"}>CIS Status: {oc.cisStatus}</Badge>}
                            {oc.elStatus && (
                              <Badge tone="green">
                                EL: {oc.elStatus.agreementId} • {new Date(oc.elStatus.createdAt).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <label className="text-sm text-gray-600">Conga Template:</label>
                            <select 
                              className="rounded-lg border px-2 py-1 text-sm"
                              value={oc.congaTemplate}
                              onChange={(e) => {
                                const newTemplate = e.target.value as "Tax CLM Template" | "A-A and RAAS Conga template" | "Consulting Conga Template";
                                setOcs(prev => prev.map(p => p.id === oc.id ? { ...p, congaTemplate: newTemplate } : p));
                              }}
                            >
                              <option value="Tax CLM Template">Tax CLM Template</option>
                              <option value="A-A and RAAS Conga template">A-A and RAAS Conga template</option>
                              <option value="Consulting Conga Template">Consulting Conga Template</option>
                            </select>
                            {(() => {
                              const services = oc.grid.flatMap(row => row.services);
                              const validation = validateTemplateCompatibility(oc.congaTemplate, services);
                              return validation.warnings.length > 0 && (
                                <span className="text-xs text-amber-600" title={validation.warnings.join(', ')}>
                                  ⚠️ Template mismatch
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => setViewing(oc)}>View detail</button>
                          <button className="rounded-xl border px-3 py-2 text-sm disabled:opacity-40" onClick={() => setEditing(oc)} disabled={oc.cisStage === "Completed"}>Edit</button>
                          {/* Manage CPIF Creation for non-renewed OCs */}
                          {!oc.renewedFromId && (
                            <button
                              className="rounded-xl bg-amber-500 px-3 py-2 text-sm text-white hover:bg-amber-600 disabled:opacity-40"
                              onClick={() => setCpifEditing(oc)}
                              disabled={!canCreateCPIF(oc)}
                              title={!canCreateCPIF(oc) ? "Manage CPIF Creation requires CIS Completed & Approved and at least one selected service without a Workday Project ID" : "Manage CPIF Creation"}
                            >
                              Manage CPIF Creation
                            </button>
                          )}
                          {/* Continue Rollover for renewed OCs */}
                          {oc.renewedFromId && (
                            <button
                              className="rounded-xl bg-amber-500 px-3 py-2 text-sm text-white hover:bg-amber-600 disabled:opacity-40"
                              onClick={() => setRolloverOC(oc)}
                              disabled={!canContinueRollover(oc)}
                              title={!canContinueRollover(oc) ? "Requires CIS Completed & Approved on renewed OC" : "Continue Rollover Process in Workday"}
                            >
                              Continue Rollover Process in Workday
                            </button>
                          )}
                          {showDelete && (
                            <button
                              title="Delete OC"
                              className="rounded-xl border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => deleteOC(oc.id)}
                            >
                              <IconTrash />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* quick glance services */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Array.from(new Set(oc.grid.flatMap((r) => r.services))).map((s) => (
                          <Chip key={s}>{s}</Chip>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {/* end right column */}
      </div>
      {/* end grid container */}

      {/* View modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? viewing.ocName : ""}>
        {viewing && <ViewGrid oc={viewing} />}
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit Services: ${editing.ocName}` : ""}>
        {editing && (
          <EditGrid
            oc={editing}
            onTriggerCIS={(grid) => {
              triggerCIS(editing, grid);
            }}
            onCompleteCIS={(status) => {
              completeCIS(editing, status);
            }}
          />
        )}
      </Modal>

      {/* CPIF modal */}
      <Modal open={!!cpifEditing} onClose={() => setCpifEditing(null)} title={cpifEditing ? `Manage CPIF Creation: ${cpifEditing.ocName}` : ""}>
        {cpifEditing && (
          <CPIFGrid
            oc={cpifEditing}
            onCreateCPIF={(account, svc) => createCPIF(cpifEditing, account, svc)}
            onClose={() => setCpifEditing(null)}
          />
        )}
      </Modal>

      {/* Rollover modal */}
      <Modal open={!!rolloverOC} onClose={() => setRolloverOC(null)} title={rolloverOC ? `Continue Rollover: ${rolloverOC.ocName}` : ""}>
        {rolloverOC && (() => {
          const source = ocs.find((o) => o.id === rolloverOC.renewedFromId);
          if (!source) return <div className="text-sm text-gray-500">Source container not found.</div>;
          return <RolloverWizard source={source} />;
        })()}
      </Modal>

      {/* EL Success modal */}
      <Modal open={!!elSuccess} onClose={() => setElSuccess(null)} title={elSuccess ? `EL Created Successfully` : ""} size="lg">
        {elSuccess && (() => {
          const oc = ocs.find(o => o.id === elSuccess.ocId);
          const s = elSuccess.data;
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border p-3">
                  <div className="mb-1 text-xs text-gray-500">Opportunity Container</div>
                  <div className="text-sm font-medium">{oc?.ocName} <span className="ml-2 text-xs text-gray-500">({oc?.id})</span></div>
                  <div className="mt-1 text-xs text-gray-600">Lead: {oc?.leadAccount}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="mb-1 text-xs text-gray-500">Template</div>
                  <div className="text-sm font-medium">{s.congaTemplate}</div>
                  <div className="mt-1 text-xs text-gray-600">Created: {new Date(s.createdAt).toLocaleString()}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="mb-1 text-xs text-gray-500">Agreement</div>
                  <div className="text-sm font-medium">{s.agreementId}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="mb-1 text-xs text-gray-500">Account</div>
                  <div className="text-sm font-medium">{s.accountId}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="mb-1 text-xs text-gray-500">Contact</div>
                  <div className="text-sm font-medium">{s.contactId}</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="mb-1 text-xs text-gray-500">Status</div>
                  <div className="text-sm font-medium">{s.status}</div>
                </div>
              </div>
              {elSuccess.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800 text-sm">
                  <div className="mb-1 font-medium">Warnings</div>
                  <ul className="list-disc pl-5">
                    {elSuccess.warnings.map((w, i) => (<li key={i}>{w}</li>))}
                  </ul>
                </div>
              )}
              <div className="flex items-center justify-between">
                <a className="rounded-xl bg-green-600 px-4 py-2 text-white text-sm hover:bg-green-700" href={s.myCongaELsUrl} target="_blank" rel="noopener noreferrer">Open My Conga ELs</a>
                <button className="rounded-xl border px-4 py-2 text-sm" onClick={() => setElSuccess(null)}>Close</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Originating OC modal */}
      <Modal open={!!originatingOC} onClose={() => setOriginatingOC(null)} title={originatingOC ? `Originating Container: ${originatingOC.ocName}` : ""}>
        {originatingOC && <ViewGrid oc={originatingOC} />}
      </Modal>

      {/* Container Creation Wizard */}
              <Wizard 
                open={showContainerWizard} 
                onClose={() => {
                  setShowContainerWizard(false);
                  setCurrentOCId(null);
                }}
                ocId={currentOCId || undefined}
                onCPIFSaved={(ocId) => {
                  setSavedCPIFs(prev => ({ ...prev, [ocId]: true }));
                  // Refresh wizard rows count after saving
                  loadWizardRowsCount();
                }}
                isManageMode={currentOCId ? hasWizardRows(currentOCId) : false}
              />

      {/* Excel Grid View Modal */}
      {showExcelGrid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white shadow-xl w-[95vw] h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Excel Grid View - {currentOCId}</h2>
              <button
                onClick={() => {
                  setShowExcelGrid(false);
                  setCurrentOCId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <ExcelGridView ocId={currentOCId || ''} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
