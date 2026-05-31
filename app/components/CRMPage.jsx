"use client";

import { useEffect, useMemo, useState } from "react";
import { Brand } from "./BrandSystem";

const STORAGE_KEY = "trexiti-crm-leads-v1";

const stages = ["Research", "Contacted", "Qualified", "Audit Booked", "Proposal", "Won"];

const stageMeta = {
  Research: "Targets to investigate",
  Contacted: "First message sent",
  Qualified: "Clear operational pain",
  "Audit Booked": "Discovery scheduled",
  Proposal: "Solution scoped",
  Won: "Client secured",
};

const leadSources = ["Manual prospecting", "Referral", "Website audit request", "LinkedIn", "Real estate list", "Existing relationship"];

const interests = ["PropertyOS", "Custom software", "AI automation", "Dashboards", "Mobile app", "Integrations", "General systems audit"];

const seedLeads = [
  {
    id: "lead-001",
    name: "Dana Morrison",
    company: "Northline Property Group",
    role: "Operations Director",
    email: "dana@northline.example",
    phone: "+1 876 555 0184",
    industry: "Property management",
    source: "Real estate list",
    interest: "PropertyOS",
    stage: "Audit Booked",
    priority: "High",
    value: 18000,
    score: 92,
    size: "51-200 people",
    nextAction: "Run systems audit focused on tenant intake, contractor dispatch, and owner reports.",
    nextDate: "2026-06-03",
    pain:
      "Tenant requests are split between WhatsApp, calls, and spreadsheets. Owners ask for updates before managers have a clear status view.",
    notes: [
      {
        id: "note-001",
        text: "Strong PropertyOS fit. Emphasize maintenance visibility, request history, and owner dashboard.",
        createdAt: "2026-05-29T14:20:00.000Z",
      },
    ],
    createdAt: "2026-05-27T16:15:00.000Z",
    updatedAt: "2026-05-29T14:20:00.000Z",
  },
  {
    id: "lead-002",
    name: "Marcus Grant",
    company: "Bluegate Developments",
    role: "Managing Partner",
    email: "marcus@bluegate.example",
    phone: "+1 876 555 0119",
    industry: "Real estate development",
    source: "Referral",
    interest: "Dashboards",
    stage: "Qualified",
    priority: "High",
    value: 24000,
    score: 86,
    size: "11-50 people",
    nextAction: "Send example dashboard scope for owner reporting and inspection records.",
    nextDate: "2026-06-01",
    pain: "Project updates and property performance reports are manually assembled from email, invoices, and spreadsheets.",
    notes: [
      {
        id: "note-002",
        text: "Wants executive visibility before adding another property manager.",
        createdAt: "2026-05-28T10:05:00.000Z",
      },
    ],
    createdAt: "2026-05-24T11:30:00.000Z",
    updatedAt: "2026-05-28T10:05:00.000Z",
  },
  {
    id: "lead-003",
    name: "Alicia Bennett",
    company: "PrimeWorks Facility Services",
    role: "Founder",
    email: "alicia@primeworks.example",
    phone: "+1 876 555 0147",
    industry: "Field services",
    source: "LinkedIn",
    interest: "AI automation",
    stage: "Contacted",
    priority: "Medium",
    value: 12000,
    score: 71,
    size: "11-50 people",
    nextAction: "Follow up with workflow automation angle: dispatch, reminders, completion photos, client reporting.",
    nextDate: "2026-05-31",
    pain: "Team coordinates jobs through phone calls and manual reminders. Client reporting happens after the fact.",
    notes: [],
    createdAt: "2026-05-25T18:45:00.000Z",
    updatedAt: "2026-05-26T13:10:00.000Z",
  },
  {
    id: "lead-004",
    name: "Renee Walsh",
    company: "HarborPoint Rentals",
    role: "Owner",
    email: "renee@harborpoint.example",
    phone: "+1 876 555 0195",
    industry: "Short-term rentals",
    source: "Manual prospecting",
    interest: "Custom software",
    stage: "Research",
    priority: "Medium",
    value: 9000,
    score: 58,
    size: "1-10 people",
    nextAction: "Research portfolio size and current guest/maintenance workflow.",
    nextDate: "2026-06-04",
    pain: "Likely managing guest issues, cleaner coordination, and maintenance manually.",
    notes: [],
    createdAt: "2026-05-30T12:00:00.000Z",
    updatedAt: "2026-05-30T12:00:00.000Z",
  },
];

const emptyLead = {
  name: "",
  company: "",
  role: "",
  email: "",
  phone: "",
  industry: "",
  source: "Manual prospecting",
  interest: "PropertyOS",
  stage: "Research",
  priority: "Medium",
  value: 0,
  score: 50,
  size: "",
  nextAction: "",
  nextDate: "",
  pain: "",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "No date set";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function createId(prefix = "lead") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeLead(lead) {
  return {
    ...emptyLead,
    ...lead,
    id: lead.id || createId(),
    value: Number(lead.value) || 0,
    score: Math.min(100, Math.max(0, Number(lead.score) || 0)),
    notes: Array.isArray(lead.notes) ? lead.notes : [],
    createdAt: lead.createdAt || new Date().toISOString(),
    updatedAt: lead.updatedAt || new Date().toISOString(),
  };
}

function exportCsv(leads) {
  const headers = [
    "Company",
    "Contact",
    "Role",
    "Email",
    "Phone",
    "Industry",
    "Source",
    "Interest",
    "Stage",
    "Priority",
    "Value",
    "Score",
    "Business Size",
    "Next Action",
    "Next Date",
    "Pain",
  ];
  const rows = leads.map((lead) => [
    lead.company,
    lead.name,
    lead.role,
    lead.email,
    lead.phone,
    lead.industry,
    lead.source,
    lead.interest,
    lead.stage,
    lead.priority,
    lead.value,
    lead.score,
    lead.size,
    lead.nextAction,
    lead.nextDate,
    lead.pain,
  ]);

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CRMPage() {
  const [leads, setLeads] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [form, setForm] = useState(emptyLead);
  const [noteText, setNoteText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map(normalizeLead);
        setLeads(parsed);
        setSelectedId(parsed[0]?.id || "");
        return;
      } catch {
        setStatus("CRM storage could not be read, so the demo pipeline was loaded.");
      }
    }

    setLeads(seedLeads);
    setSelectedId(seedLeads[0].id);
  }, []);

  useEffect(() => {
    if (leads.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  const selectedLead = useMemo(() => leads.find((lead) => lead.id === selectedId) || leads[0], [leads, selectedId]);

  const filteredLeads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStage = stageFilter === "All" || lead.stage === stageFilter;
      const haystack = [lead.name, lead.company, lead.email, lead.industry, lead.interest, lead.pain].join(" ").toLowerCase();
      return matchesStage && (!normalized || haystack.includes(normalized));
    });
  }, [leads, query, stageFilter]);

  const metrics = useMemo(() => {
    const active = leads.filter((lead) => lead.stage !== "Won").length;
    const value = leads.reduce((sum, lead) => sum + (Number(lead.value) || 0), 0);
    const audits = leads.filter((lead) => lead.stage === "Audit Booked").length;
    const highIntent = leads.filter((lead) => lead.score >= 80).length;
    const due = leads.filter((lead) => {
      if (!lead.nextDate) return false;
      const today = new Date();
      const followUp = new Date(`${lead.nextDate}T23:59:59`);
      return followUp <= today;
    }).length;

    return [
      ["Active leads", active, "Prospects still moving"],
      ["Pipeline value", formatCurrency(value), "Estimated opportunity"],
      ["Audits booked", audits, "Ready for discovery"],
      ["High-intent", highIntent, "Score 80 or above"],
      ["Due now", due, "Follow-ups needing action"],
    ];
  }, [leads]);

  const upsertLead = (event) => {
    event.preventDefault();
    const now = new Date().toISOString();
    const lead = normalizeLead({
      ...form,
      id: createId(),
      createdAt: now,
      updatedAt: now,
      notes: [],
    });
    setLeads((current) => [lead, ...current]);
    setSelectedId(lead.id);
    setForm(emptyLead);
    setStatus(`${lead.company || lead.name} added to the CRM.`);
  };

  const updateLead = (id, updates) => {
    setLeads((current) =>
      current.map((lead) => (lead.id === id ? normalizeLead({ ...lead, ...updates, updatedAt: new Date().toISOString() }) : lead)),
    );
  };

  const addNote = () => {
    if (!selectedLead || !noteText.trim()) return;
    const note = {
      id: createId("note"),
      text: noteText.trim(),
      createdAt: new Date().toISOString(),
    };
    updateLead(selectedLead.id, { notes: [note, ...(selectedLead.notes || [])] });
    setNoteText("");
  };

  const deleteLead = (id) => {
    setLeads((current) => current.filter((lead) => lead.id !== id));
    const next = leads.find((lead) => lead.id !== id);
    setSelectedId(next?.id || "");
  };

  const importJson = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!Array.isArray(imported)) throw new Error("Expected a JSON array of leads.");
      const normalized = imported.map(normalizeLead);
      setLeads(normalized);
      setSelectedId(normalized[0]?.id || "");
      setStatus("CRM data imported.");
    } catch (error) {
      setStatus(`Import failed: ${error.message}`);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <>
      <header className="crm-header">
        <Brand href="/" />
        <div className="admin-profile-chip" aria-label="Current admin profile">
          <span>Admin Profile</span>
          <strong>Trexiti Operator</strong>
        </div>
        <nav aria-label="CRM navigation">
          <a href="/">Website</a>
          <a href="/contact">Audit Page</a>
          <a href="/propertyos">PropertyOS</a>
        </nav>
      </header>

      <main className="crm-shell">
        <section className="crm-hero">
          <div>
            <p className="eyebrow">Private Admin Console</p>
            <h1>Manage Trexiti leads, audits, pipeline, outreach, and next actions.</h1>
            <p>
              A hidden operating profile for hunting leads, tracking Systems Audit opportunities, managing PropertyOS prospects, and keeping every
              follow-up visible behind the public website.
            </p>
          </div>
          <div className="crm-actions">
            <button className="button button-primary" type="button" onClick={() => document.getElementById("new-lead")?.scrollIntoView()}>
              Add Lead
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => downloadFile("trexiti-crm-leads.json", JSON.stringify(leads, null, 2), "application/json")}
            >
              Export JSON
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => downloadFile("trexiti-crm-leads.csv", exportCsv(leads), "text/csv")}
            >
              Export CSV
            </button>
            <label className="crm-import">
              Import
              <input accept="application/json" type="file" onChange={importJson} />
            </label>
          </div>
        </section>

        <section className="crm-metrics" aria-label="CRM metrics">
          {metrics.map(([label, value, detail]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </section>

        <section className="crm-workspace">
          <div className="crm-main">
            <div className="crm-toolbar">
              <label>
                <span>Search pipeline</span>
                <input value={query} placeholder="Company, contact, industry, pain..." onChange={(event) => setQuery(event.target.value)} />
              </label>
              <label>
                <span>Stage</span>
                <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
                  <option>All</option>
                  {stages.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="crm-board" aria-label="Lead pipeline">
              {stages.map((stage) => {
                const stageLeads = filteredLeads.filter((lead) => lead.stage === stage);
                return (
                  <section className="crm-column" key={stage}>
                    <div className="crm-column-header">
                      <div>
                        <h2>{stage}</h2>
                        <p>{stageMeta[stage]}</p>
                      </div>
                      <span>{stageLeads.length}</span>
                    </div>
                    <div className="crm-card-stack">
                      {stageLeads.map((lead) => (
                        <button
                          className={`crm-lead-card${selectedLead?.id === lead.id ? " is-selected" : ""}`}
                          key={lead.id}
                          type="button"
                          onClick={() => setSelectedId(lead.id)}
                        >
                          <span className={`priority-pill priority-${lead.priority.toLowerCase()}`}>{lead.priority}</span>
                          <strong>{lead.company || "Unnamed company"}</strong>
                          <p>{lead.name || "No contact"} · {lead.interest}</p>
                          <div>
                            <span>{formatCurrency(lead.value)}</span>
                            <span>{lead.score}/100</span>
                          </div>
                          <small>{lead.nextAction || "No next action set"}</small>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>

          <aside className="crm-detail-panel" aria-label="Selected lead details">
            {selectedLead ? (
              <>
                <div className="dashboard-topbar">
                  <span />
                  <span />
                  <span />
                  <p>Lead Intelligence</p>
                </div>
                <div className="crm-selected-head">
                  <span className={`priority-pill priority-${selectedLead.priority.toLowerCase()}`}>{selectedLead.priority}</span>
                  <h2>{selectedLead.company || "Unnamed company"}</h2>
                  <p>{selectedLead.name} · {selectedLead.role || "Decision maker"}</p>
                </div>

                <div className="crm-detail-grid">
                  <label>
                    <span>Stage</span>
                    <select value={selectedLead.stage} onChange={(event) => updateLead(selectedLead.id, { stage: event.target.value })}>
                      {stages.map((stage) => (
                        <option key={stage}>{stage}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Priority</span>
                    <select value={selectedLead.priority} onChange={(event) => updateLead(selectedLead.id, { priority: event.target.value })}>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </label>
                  <label>
                    <span>Score</span>
                    <input
                      min="0"
                      max="100"
                      type="number"
                      value={selectedLead.score}
                      onChange={(event) => updateLead(selectedLead.id, { score: event.target.value })}
                    />
                  </label>
                  <label>
                    <span>Value</span>
                    <input type="number" value={selectedLead.value} onChange={(event) => updateLead(selectedLead.id, { value: event.target.value })} />
                  </label>
                  <label>
                    <span>Next date</span>
                    <input type="date" value={selectedLead.nextDate} onChange={(event) => updateLead(selectedLead.id, { nextDate: event.target.value })} />
                  </label>
                  <label>
                    <span>Interest</span>
                    <select value={selectedLead.interest} onChange={(event) => updateLead(selectedLead.id, { interest: event.target.value })}>
                      {interests.map((interest) => (
                        <option key={interest}>{interest}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="crm-intel-block">
                  <span>Operational pain</span>
                  <textarea value={selectedLead.pain} onChange={(event) => updateLead(selectedLead.id, { pain: event.target.value })} />
                </div>
                <div className="crm-intel-block">
                  <span>Next action</span>
                  <textarea value={selectedLead.nextAction} onChange={(event) => updateLead(selectedLead.id, { nextAction: event.target.value })} />
                </div>

                <div className="crm-contact-grid">
                  <a href={`mailto:${selectedLead.email}?subject=${encodeURIComponent("Trexiti Systems Audit")}`}>Email</a>
                  <a href={`tel:${selectedLead.phone}`}>Call</a>
                  <a href={`/contact?company=${encodeURIComponent(selectedLead.company || "")}`}>Audit page</a>
                </div>

                <div className="crm-notes">
                  <h3>Notes</h3>
                  <div className="crm-note-composer">
                    <textarea value={noteText} placeholder="Add call notes, objections, buying signals, or follow-up details." onChange={(event) => setNoteText(event.target.value)} />
                    <button className="button button-secondary" type="button" onClick={addNote}>
                      Add Note
                    </button>
                  </div>
                  <div className="crm-note-list">
                    {(selectedLead.notes || []).map((note) => (
                      <article key={note.id}>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        <p>{note.text}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <button className="crm-delete" type="button" onClick={() => deleteLead(selectedLead.id)}>
                  Delete lead
                </button>
              </>
            ) : (
              <p>No lead selected.</p>
            )}
          </aside>
        </section>

        <section className="crm-lower-grid">
          <form className="crm-create-panel" id="new-lead" onSubmit={upsertLead}>
            <div className="form-header">
              <p className="eyebrow">New Opportunity</p>
              <h2>Add a lead to the pipeline.</h2>
            </div>
            <div className="crm-create-grid">
              <label>
                <span>Contact name</span>
                <input value={form.name} required onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label>
                <span>Company</span>
                <input value={form.company} required onChange={(event) => setForm({ ...form, company: event.target.value })} />
              </label>
              <label>
                <span>Role</span>
                <input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <label>
                <span>Phone / WhatsApp</span>
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
              <label>
                <span>Industry</span>
                <input value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} />
              </label>
              <label>
                <span>Source</span>
                <select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>
                  {leadSources.map((source) => (
                    <option key={source}>{source}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Interest</span>
                <select value={form.interest} onChange={(event) => setForm({ ...form, interest: event.target.value })}>
                  {interests.map((interest) => (
                    <option key={interest}>{interest}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Stage</span>
                <select value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })}>
                  {stages.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Priority</span>
                <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </label>
              <label>
                <span>Value</span>
                <input type="number" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />
              </label>
              <label>
                <span>Score</span>
                <input min="0" max="100" type="number" value={form.score} onChange={(event) => setForm({ ...form, score: event.target.value })} />
              </label>
              <label className="form-wide">
                <span>Operational pain</span>
                <textarea value={form.pain} onChange={(event) => setForm({ ...form, pain: event.target.value })} />
              </label>
              <label className="form-wide">
                <span>Next action</span>
                <textarea value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} />
              </label>
            </div>
            <button className="button button-primary" type="submit">
              Add Lead to CRM
            </button>
            <p className="form-status">{status}</p>
          </form>

          <aside className="crm-playbook">
            <p className="eyebrow">Lead Hunting Playbook</p>
            <h2>Use the CRM around operational pain.</h2>
            <ul>
              <li>Target companies still coordinating work through WhatsApp, spreadsheets, calls, and manual reminders.</li>
              <li>Score leads higher when they manage properties, field teams, owner reports, inspections, or recurring service requests.</li>
              <li>Move leads to Qualified when the pain is specific enough to map into a system.</li>
              <li>Book the audit as the first real conversion, then scope PropertyOS or a custom systems build.</li>
            </ul>
          </aside>
        </section>
      </main>
    </>
  );
}
