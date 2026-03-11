import { useState, useRef } from "react";
import { Copy, Check, Download, RefreshCw, Plus } from "lucide-react";

const ubuntuLink = document.createElement("link");
ubuntuLink.rel = "stylesheet";
ubuntuLink.href = "https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&display=swap";
document.head.appendChild(ubuntuLink);

const placeholderStyle = document.createElement("style");
placeholderStyle.textContent = `input::placeholder, textarea::placeholder { color: #BBBBBB; }`;
document.head.appendChild(placeholderStyle);

const USE_MOCK = false;
const WEBHOOK_URL = "https://yonakatitin.app.n8n.cloud/webhook/normec-campaign";

// ── PDF Text Extractor ───────────────────────────────────────
const extractTextFromPdf = async (file) => {
  return new Promise((resolve, reject) => {
    const loadAndExtract = async () => {
      try {
        const pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: false });
          const lines = {};
          for (const item of content.items) {
            if (!item.str) continue;
            const y = Math.round(item.transform[5]);
            if (!lines[y]) lines[y] = [];
            lines[y].push({ x: item.transform[4], str: item.str });
          }
          const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a);
          for (const y of sortedYs) {
            const lineItems = lines[y].sort((a, b) => a.x - b.x);
            const lineText = lineItems.map((it) => it.str).join(" ").trim();
            if (lineText) fullText += lineText + "\n";
          }
          fullText += "\n";
        }
        resolve(fullText.trim());
      } catch (e) { reject(e); }
    };
    if (window.pdfjsLib) { loadAndExtract(); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = loadAndExtract;
    script.onerror = () => reject(new Error("Failed to load PDF.js library"));
    document.head.appendChild(script);
  });
};

// ── API Call ─────────────────────────────────────────────────
const generateCampaign = async (formData) => {
  if (USE_MOCK) { await new Promise((r) => setTimeout(r, 2000)); return MOCK_RESPONSE; }
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  const text = await res.text();
  if (!text || text.trim() === "") throw new Error("Empty response from workflow. Check if n8n is active and all nodes are connected.");
  let data;
  try { data = JSON.parse(text); } catch (e) { throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`); }
  if (!res.ok) throw new Error(data?.message || `Workflow error: ${res.status}`);
  return data;
};

// ── Mock Response ────────────────────────────────────────────
const MOCK_RESPONSE = {
  success: true,
  extracted: {
    entity: "Normec FoodSafe", service_name: "FoodSafe Certification",
    target_audience: "Food manufacturers & distributors in Southeast Asia",
    key_problem: "Difficulty meeting international food safety standards (ISO 22000, HACCP)",
    value_proposition: "Fast-track certification with end-to-end audit support in 10 days",
    key_differentiators: ["On-site expert team", "10-day turnaround", "Free re-audit guarantee"],
    tone: "professional", campaign_language: "en",
    key_activities: "Lab testing, inspections, certification, audits",
    needs: "Fast, reliable certification process for food safety compliance",
    value_propositions: "Fast-track ISO 22000 certification in 10 days with on-site expert team",
    channels: "LinkedIn, Email (Copernica), Landing page (Contentful)",
    kpis: "50 leads/month, 5% conversion rate, 200 landing page visits",
    strategic_context: "Expanding into SEA market, competing with SGS and Bureau Veritas",
    budget_indication: "€5,000 for LinkedIn ads, €2,000 for email campaign",
    follow_up_by: "Regional Sales Team — Southeast Asia",
    service_detail: "ISO 22000, HACCP, BRC, IFS audit & certification. Free re-audit guarantee, 10-day turnaround.",
    geographic_focus: "Southeast Asia — Indonesia, Malaysia, Philippines, Vietnam",
  },
  campaign: {
    landing_page: {
      headline: "Get ISO 22000 Certified — Without the Guesswork",
      subheadline: "Normec FoodSafe guides food manufacturers through every step of certification — fast, reliable, and expert-led.",
      body_copy: "Meeting international food safety standards shouldn't slow your business down. Our certified auditors work on-site with your team to identify gaps, implement corrective actions, and ensure first-time certification success.\n\nWith a 10-day turnaround and a free re-audit guarantee, there's no reason to delay your path to compliance.",
      cta_text: "Request a Free Compliance Assessment",
    },
    linkedin: {
      phase_1: { label: "Phase 1 · Awareness", hook: "73% of food manufacturers fail their first international audit — here's why.", body: "International buyers are tightening requirements. Most manufacturers don't know their compliance gaps until it's too late — costing them contracts, delays, and fines.", cta: "Read: 5 Signs Your Facility Needs a Compliance Review →" },
      phase_2: { label: "Phase 2 · Consideration", hook: "What does a 10-day certification process actually look like?", body: "We walk you through every step — from gap analysis to final audit — with a dedicated Normec expert by your side. No guesswork, no delays, no surprises.", cta: "Download our FoodSafe Certification Roadmap →" },
      phase_3: { label: "Phase 3 · Conversion", hook: "Your competitors are already certified. Are you?", body: "Normec has helped 200+ food manufacturers in Southeast Asia achieve international certification. Our next onboarding cohort starts April 2026 — limited spots available.", cta: "Book a Free Consultation — Limited Spots Available →" },
    },
    email: {
      subject_line: "Is your facility audit-ready? Let's find out.",
      preview_text: "A free 30-minute compliance assessment — no strings attached.",
      body: "Hi [First Name],\n\nFood safety audits are coming — and the companies that prepare early win the contracts.\n\nNormec FoodSafe offers a free 30-minute compliance assessment to identify your biggest certification gaps before an auditor does.\n\nIn 10 days, we can have you on the path to ISO 22000 or HACCP certification — with our expert team guiding every step.\n\nSpots are limited for April 2026.",
      cta_text: "Book My Free Assessment",
    },
  },
  qualityCheck: {
    score: 87, status: "good", issues: [],
    suggestions: ["Consider adding social proof statistics", "Add urgency element to subject line"],
  },
  meta: { generated_at: new Date().toISOString(), model: "llama-3.3-70b-versatile", provider: "groq", version: "1.0.0" },
};

// ── Design System ─────────────────────────────────────────────
const C = {
  orange:  "#EE7203",
  cream:   "#FBF7F4",
  black:   "#111111",
  dark:    "#2A2A2A",
  mid:     "#6B6B6B",
  light:   "#A8A8A8",
  border:  "#E4DDD6",
  white:   "#FFFFFF",
  surface: "#F7F3F0",
};
const F = "'Ubuntu', sans-serif";

// ── Primitives ────────────────────────────────────────────────
const Pill = ({ children }) => (
  <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 999, border: `1px solid ${C.border}`, fontSize: 12, color: C.mid, fontFamily: F, background: C.white, whiteSpace: "nowrap" }}>
    {children}
  </span>
);

const Tag = ({ children, active }) => (
  <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 999, fontSize: 12, fontFamily: F, fontWeight: active ? 500 : 400, background: active ? C.orange : C.white, color: active ? C.white : C.mid, border: `1px solid ${active ? C.orange : C.border}` }}>
    {children}
  </span>
);

const FieldLabel = ({ children, required }) => (
  <div style={{ fontSize: 12, fontWeight: 500, color: C.mid, marginBottom: 6, fontFamily: F, letterSpacing: "0.01em" }}>
    {children}{required && <span style={{ color: C.orange, marginLeft: 3 }}>*</span>}
  </div>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 24, display: "flex", alignItems: "baseline", gap: 10 }}>
    <div style={{ fontSize: 11, fontWeight: 500, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: F }}>{children}</div>
    {sub && <div style={{ fontSize: 12, color: C.light, fontFamily: F }}>{sub}</div>}
  </div>
);

const Divider = () => <div style={{ height: 1, background: C.border, margin: "28px 0" }} />;

const inputStyle = (filled) => ({
  width: "100%", padding: "10px 14px", borderRadius: 6,
  border: `1px solid ${filled ? C.dark : C.border}`,
  fontSize: 13, color: C.dark, outline: "none",
  boxSizing: "border-box", fontFamily: F, background: C.white,
  transition: "border-color 0.15s",
});

const FieldInput = ({ f, value, onChange }) => f.area
  ? <textarea value={value || ""} onChange={onChange} placeholder={f.placeholder} rows={2} style={{ ...inputStyle(!!value), resize: "vertical" }} />
  : <input type={f.type || "text"} value={value || ""} onChange={onChange} placeholder={f.placeholder} style={inputStyle(!!value)} />;

// ── Buttons ───────────────────────────────────────────────────
const BtnPrimary = ({ onClick, disabled, children, full }) => (
  <button onClick={onClick} disabled={disabled} style={{ width: full ? "100%" : "auto", padding: "11px 28px", background: disabled ? C.border : C.orange, color: disabled ? C.light : C.white, border: "none", borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: disabled ? "not-allowed" : "pointer", fontFamily: F, letterSpacing: "0.01em", display: "inline-flex", alignItems: "center", gap: 8 }}>
    {children}
  </button>
);

const BtnOutline = ({ onClick, disabled, children }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding: "10px 22px", background: hovered ? C.dark : C.white, color: hovered ? C.white : C.dark, border: `1px solid ${hovered ? C.dark : C.border}`, borderRadius: 6, fontWeight: 400, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", fontFamily: F, display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}
    >
      {children}
    </button>
  );
};

// ── Stepper ──────────────────────────────────────────────────
const STEPS = ["Input BMC", "Review", "Campaign Output"];
const Stepper = ({ current }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
    {STEPS.map((s, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: i < current ? C.orange : i === current ? C.dark : C.white, color: i <= current ? C.white : C.light, fontWeight: 500, fontSize: 12, border: `1px solid ${i === current ? C.dark : i < current ? C.orange : C.border}`, flexShrink: 0, fontFamily: F }}>
            {i < current ? "✓" : i + 1}
          </div>
          <span style={{ fontSize: 13, fontWeight: i === current ? 500 : 400, color: i === current ? C.dark : C.light, whiteSpace: "nowrap", fontFamily: F }}>{s}</span>
        </div>
        {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < current ? C.orange : C.border, margin: "0 16px" }} />}
      </div>
    ))}
  </div>
);

// ── Download Word ─────────────────────────────────────────────
const downloadWord = (campaign, extracted) => {
  const { landing_page: lp, linkedin, email } = campaign;
  const liPhases = Object.values(linkedin).map((p) =>
    `<div class="phase-box">
      <div class="phase-label">${p.label}</div>
      <p class="hook">${p.hook}</p>
      <p>${p.body}</p>
      <p class="cta-link">${p.cta}</p>
    </div>`
  ).join("");
  const html = `
    <html><head><meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'Ubuntu', Calibri, sans-serif; margin: 0; padding: 40px 48px; color: #2A2A2A; background: #FBF7F4; font-size: 13px; line-height: 1.7; }
      .header { border-bottom: 2px solid #EE7203; padding-bottom: 16px; margin-bottom: 32px; }
      .header-label { font-size: 11px; color: #EE7203; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 500; margin-bottom: 6px; }
      h1 { font-size: 24px; font-weight: 700; color: #111; margin: 0 0 4px; }
      .meta { font-size: 12px; color: #A8A8A8; }
      h2 { font-size: 11px; font-weight: 500; color: #EE7203; text-transform: uppercase; letter-spacing: 0.12em; margin: 36px 0 16px; border-bottom: 1px solid #E4DDD6; padding-bottom: 8px; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 8px; }
      td { padding: 10px 14px; border: 1px solid #E4DDD6; vertical-align: top; font-size: 13px; }
      td.label { background: #F7F3F0; font-weight: 500; color: #6B6B6B; width: 150px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
      .cta-btn { background: #EE7203; color: white; padding: 8px 20px; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 13px; }
      .phase-box { border: 1px solid #E4DDD6; border-radius: 6px; padding: 18px 20px; margin-bottom: 10px; background: #FFFFFF; }
      .phase-label { font-size: 11px; color: #EE7203; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
      .hook { font-weight: 500; font-size: 14px; color: #111; margin: 0 0 8px; }
      .cta-link { color: #EE7203; font-weight: 500; margin: 8px 0 0; }
      p { margin: 0 0 8px; }
    </style>
    </head><body>
    <div class="header">
      <div class="header-label">Normec · Internal Tool</div>
      <h1>AI Campaign Generator</h1>
      <div class="meta">${extracted.entity || "-"} &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString("en-GB")}</div>
    </div>

    <h2>Landing Page</h2>
    <table>
      <tr><td class="label">Headline</td><td><strong style="font-size:15px">${lp.headline}</strong></td></tr>
      <tr><td class="label">Subheadline</td><td>${lp.subheadline}</td></tr>
      <tr><td class="label">Body Copy</td><td>${lp.body_copy.replace(/\n/g, "<br/>")}</td></tr>
      <tr><td class="label">CTA Button</td><td><span class="cta-btn">${lp.cta_text} ↗</span></td></tr>
    </table>

    <h2>LinkedIn Campaign — 3 Phases</h2>
    ${liPhases}

    <h2>Email — Copernica</h2>
    <table>
      <tr><td class="label">Subject Line</td><td><strong>${email.subject_line}</strong></td></tr>
      <tr><td class="label">Preview Text</td><td>${email.preview_text}</td></tr>
      <tr><td class="label">Body</td><td>${email.body.replace(/\n/g, "<br/>")}</td></tr>
      <tr><td class="label">CTA Button</td><td><span class="cta-btn">${email.cta_text} ↗</span></td></tr>
    </table>
    </body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Normec_Campaign_${(extracted.entity || "Export").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.doc`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Field Config ─────────────────────────────────────────────
const BMC_MANUAL_SECTIONS = [
  {
    section: "Campaign Info",
    fields: [
      { key: "entity", label: "Entity", placeholder: "e.g. Normec FoodSafe", required: true },
      { key: "date", label: "Date", placeholder: "e.g. March 2026" },
      { key: "contact_person", label: "Contact Person", placeholder: "e.g. John Smith" },
      { key: "completed_by", label: "Completed By", placeholder: "e.g. Marketing Team" },
    ],
  },
  {
    section: "Business Model Canvas",
    fields: [
      { key: "key_activities", label: "Key Activities", placeholder: "e.g. Lab testing, inspections, certification, audits", area: true, required: true },
      { key: "needs", label: "Needs", placeholder: "e.g. Fast, reliable certification process for food safety compliance", area: true, required: true },
      { key: "value_propositions", label: "Value Propositions", placeholder: "e.g. Fast-track ISO 22000 certification in 10 days with on-site expert team", area: true, required: true },
      { key: "channels", label: "Channels", placeholder: "e.g. LinkedIn, Email (Copernica), Landing page (Contentful)", area: true, required: true },
      { key: "target_audience", label: "Target Audience", placeholder: "e.g. Food manufacturers & distributors in Southeast Asia", area: true, required: true },
      { key: "kpis", label: "KPI's", placeholder: "e.g. 50 leads/month, 5% conversion rate, 200 landing page visits", area: true, required: true },
      { key: "strategic_context", label: "Strategic Context", placeholder: "e.g. Expanding into SEA market, competing with SGS and Bureau Veritas", area: true, required: true },
      { key: "budget_indication", label: "Budget Indication", placeholder: "e.g. €5,000 for LinkedIn ads, €2,000 for email campaign", required: true },
      { key: "follow_up_by", label: "Follow-up By (Integrated Sales/Entity)", placeholder: "e.g. Regional Sales Team — Southeast Asia", required: true },
    ],
  },
  {
    section: "Service Details",
    optional: true,
    fields: [
      { key: "service_name", label: "Service Name", placeholder: "e.g. FoodSafe Certification" },
      { key: "service_detail", label: "Service Detail", placeholder: "e.g. ISO 22000, HACCP, BRC, IFS audit & certification. Free re-audit guarantee, 10-day turnaround. Price: €35k–€120k.", area: true },
    ],
  },
];

const SERVICE_DETAIL_FIELDS = [
  { key: "service_name", label: "Service Name", placeholder: "e.g. FoodSafe Certification" },
  { key: "service_detail", label: "Service Detail", placeholder: "e.g. ISO 22000, HACCP, BRC, IFS certification. Free re-audit guarantee, 10-day turnaround. Price: €35k–€120k.", area: true },
];

// ── BMC Form ─────────────────────────────────────────────────
const BMCForm = ({ onSubmit, loading }) => {
  const [inputMethod, setInputMethod] = useState("text");
  const [form, setForm] = useState({});
  const [fileName, setFileName] = useState(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfText, setPdfText] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [tone, setTone] = useState("professional");
  const fileRef = useRef();

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const manualRequiredKeys = BMC_MANUAL_SECTIONS.flatMap((s) => s.fields.filter((f) => f.required).map((f) => f.key));
  const isManualValid = manualRequiredKeys.every((k) => form[k]?.trim());
  const isValid = inputMethod === "pdf" ? !!pdfText : isManualValid;

  const handleFile = async (file) => {
    if (!file || file.type !== "application/pdf") { alert("Please upload a valid PDF file."); return; }
    setFileName(file.name); setPdfText(null); setPdfParsing(true);
    try { const text = await extractTextFromPdf(file); setPdfText(text); }
    catch (e) { alert(`Failed to parse PDF: ${e.message}`); setFileName(null); }
    finally { setPdfParsing(false); }
  };

  const handleSubmit = () => onSubmit({
    ...form, tone, input_method: inputMethod,
    ...(inputMethod === "pdf" && pdfText ? { pdf_text: pdfText } : {}),
  });

  return (
    <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}` }}>
      {/* Form Header */}
      <div style={{ padding: "28px 32px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8, fontFamily: F }}>New Campaign</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.black, margin: "0 0 6px", fontFamily: F }}>Business Model Canvas</h2>
        <p style={{ fontSize: 14, color: C.mid, margin: "0 0 24px", fontFamily: F, fontWeight: 300 }}>
          Fill in the BMC template manually or upload a completed PDF document.
        </p>

        {/* Method Toggle */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {[{ id: "text", label: "Fill manually" }, { id: "pdf", label: "Upload PDF" }].map((m) => (
            <button key={m.id} onClick={() => setInputMethod(m.id)} style={{ padding: "7px 20px", borderRadius: 999, border: `1px solid ${inputMethod === m.id ? C.dark : C.border}`, background: inputMethod === m.id ? C.dark : C.white, color: inputMethod === m.id ? C.white : C.mid, fontWeight: inputMethod === m.id ? 500 : 400, fontSize: 13, cursor: "pointer", fontFamily: F }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: C.border }} />

      {/* Manual Form */}
      {inputMethod === "text" && (
        <div style={{ padding: "28px 32px" }}>
          {BMC_MANUAL_SECTIONS.map((section, si) => (
            <div key={section.section}>
              {si > 0 && <Divider />}
              <SectionTitle children={section.section} sub={section.optional ? "Optional — leave blank if not applicable" : null} />
              <div style={{ display: "grid", gridTemplateColumns: section.section === "Campaign Info" ? "1fr 1fr" : "1fr", gap: 16 }}>
                {section.fields.map((f) => (
                  <div key={f.key} style={{ gridColumn: f.area ? "1 / -1" : "auto" }}>
                    <FieldLabel required={f.required}>{f.label}</FieldLabel>
                    <FieldInput f={f} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Upload */}
      {inputMethod === "pdf" && (
        <div style={{ padding: "28px 32px" }}>
          <SectionTitle children="Business Model Canvas" />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => !pdfParsing && fileRef.current.click()}
            style={{ border: `1px dashed ${dragOver ? C.dark : pdfText ? C.orange : C.border}`, borderRadius: 6, padding: "36px 24px", textAlign: "center", background: dragOver ? C.surface : pdfText ? "#FFF8F0" : C.cream, cursor: pdfParsing ? "wait" : "pointer", marginBottom: 28 }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{pdfParsing ? "⏳" : pdfText ? "✓" : "↑"}</div>
            {pdfParsing ? (
              <><div style={{ fontWeight: 500, color: C.dark, fontFamily: F }}>Parsing PDF...</div><div style={{ fontSize: 12, color: C.light, marginTop: 4, fontFamily: F }}>Extracting text from your document</div></>
            ) : pdfText ? (
              <><div style={{ fontWeight: 500, color: C.orange, marginBottom: 4, fontFamily: F }}>{fileName}</div><div style={{ fontSize: 12, color: C.light, fontFamily: F }}>{pdfText.length.toLocaleString()} characters extracted · Click to replace</div></>
            ) : fileName ? (
              <><div style={{ fontWeight: 500, color: C.mid, fontFamily: F }}>{fileName}</div><div style={{ fontSize: 12, color: C.light, marginTop: 4, fontFamily: F }}>Parsing failed — click to try another file</div></>
            ) : (
              <><div style={{ fontWeight: 500, color: C.dark, marginBottom: 4, fontFamily: F }}>Drag & drop your BMC PDF here</div><div style={{ fontSize: 12, color: C.light, fontFamily: F }}>or click to browse — PDF only, max 10MB</div></>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />

          <Divider />
          <SectionTitle children="Service Details" sub="Optional — useful if the BMC doesn't include full service details" />
          <div style={{ display: "grid", gap: 16 }}>
            {SERVICE_DETAIL_FIELDS.map((f) => (
              <div key={f.key}>
                <FieldLabel>{f.label}</FieldLabel>
                <FieldInput f={f} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ height: 1, background: C.border }} />
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface, borderRadius: "0 0 8px 8px" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: C.mid, marginBottom: 8, fontFamily: F }}>Communication Tone</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["Professional", "Urgent", "Educational"].map((t) => (
              <button key={t} onClick={() => setTone(t.toLowerCase())} style={{ padding: "5px 16px", borderRadius: 999, border: `1px solid ${tone === t.toLowerCase() ? C.dark : C.border}`, background: tone === t.toLowerCase() ? C.dark : C.white, color: tone === t.toLowerCase() ? C.white : C.mid, fontSize: 12, cursor: "pointer", fontFamily: F }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <BtnPrimary onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? "Generating..." : "Extract & Generate ↗"}
          </BtnPrimary>
          {!isValid && <div style={{ fontSize: 11, color: C.light, fontFamily: F }}>{inputMethod === "pdf" ? "Upload a PDF to continue" : "Fill in all required fields to continue"}</div>}
        </div>
      </div>
    </div>
  );
};

// ── Extraction Review ─────────────────────────────────────────
const REVIEW_SECTIONS = [
  {
    section: "Campaign Info", alwaysShow: true,
    fields: [
      { key: "entity", label: "Entity" },
      { key: "date", label: "Date" },
      { key: "contact_person", label: "Contact Person" },
      { key: "completed_by", label: "Completed By" },
      { key: "tone", label: "Tone" },
      { key: "campaign_language", label: "Language" },
    ],
  },
  {
    section: "Business Model Canvas", alwaysShow: true,
    fields: [
      { key: "key_activities", label: "Key Activities", area: true },
      { key: "needs", label: "Needs", area: true },
      { key: "value_propositions", label: "Value Propositions", area: true },
      { key: "channels", label: "Channels", area: true },
      { key: "target_audience", label: "Target Audience", area: true },
      { key: "kpis", label: "KPI's", area: true },
      { key: "strategic_context", label: "Strategic Context", area: true },
      { key: "budget_indication", label: "Budget Indication" },
      { key: "follow_up_by", label: "Follow-up By" },
    ],
  },
  {
    section: "Service Details", alwaysShow: true,
    fields: [
      { key: "service_name", label: "Service Name" },
      { key: "service_detail", label: "Service Detail", area: true },
    ],
  },
  {
    section: "Campaign Intelligence", alwaysShow: false,
    fields: [
      { key: "key_problem", label: "Key Problem", area: true },
      { key: "value_proposition", label: "Value Proposition", area: true },
      { key: "key_differentiators", label: "Key Differentiators", array: true },
      { key: "geographic_focus", label: "Geographic Focus" },
    ],
  },
];

const ReviewField = ({ f, v, section, onChange }) => {
  const isEmpty = !v || (typeof v === "string" && (v.trim() === "" || v.trim() === "-"));
  const baseInput = { width: "100%", fontSize: 13, color: isEmpty ? C.light : C.dark, border: `1px solid ${C.border}`, borderRadius: 4, padding: "8px 10px", boxSizing: "border-box", fontFamily: F, background: isEmpty ? C.cream : C.white };
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 500, color: C.light, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5, fontFamily: F }}>{f.label}</div>
      {f.array && Array.isArray(v) ? (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {v.length > 0 ? v.map((item, i) => <Pill key={i}>{item}</Pill>) : <span style={{ fontSize: 13, color: C.light, fontFamily: F }}>—</span>}
        </div>
      ) : f.area ? (
        <textarea value={isEmpty ? "" : (v || "")} onChange={onChange} placeholder="—" rows={2} style={{ ...baseInput, resize: "vertical" }} />
      ) : (
        <input value={isEmpty ? "" : (v || "")} onChange={onChange} placeholder="—" style={baseInput} />
      )}
    </div>
  );
};

const ExtractionReview = ({ formData, extracted, onConfirm, onBack }) => {
  const isPdf = formData?.input_method === "pdf";
  const [data, setData] = useState({ ...formData, ...extracted });
  const set = (k, v) => setData((p) => ({ ...p, [k]: v }));

  return (
    <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}` }}>
      <div style={{ padding: "28px 32px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8, fontFamily: F }}>
          {isPdf ? "AI Extraction" : "Review Input"}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.black, margin: "0 0 6px", fontFamily: F }}>
          {isPdf ? "Review Extracted Data" : "Review Your Input"}
        </h2>
        <p style={{ fontSize: 14, color: C.mid, margin: 0, fontFamily: F, fontWeight: 300 }}>
          {isPdf ? "AI has extracted the following from your PDF. Edit any field before generating." : "Confirm your input before generating the campaign."}
        </p>
        {isPdf && (
          <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, border: `1px solid ${C.border}`, fontSize: 12, color: C.mid, fontFamily: F }}>
            <span style={{ color: C.orange }}>●</span> PDF · {(formData?.pdf_text?.length || 0).toLocaleString()} characters parsed
          </div>
        )}
      </div>

      <div style={{ height: 1, background: C.border }} />

      <div style={{ padding: "28px 32px" }}>
        {REVIEW_SECTIONS.map((section, si) => {
          const visibleFields = section.alwaysShow
            ? section.fields
            : section.fields.filter((f) => { const v = data[f.key]; if (!v) return false; if (Array.isArray(v)) return v.length > 0; return String(v).trim() !== "" && String(v).trim() !== "-"; });
          if (visibleFields.length === 0) return null;
          return (
            <div key={section.section}>
              {si > 0 && <Divider />}
              <SectionTitle children={section.section} />
              <div style={{ display: "grid", gridTemplateColumns: section.section === "Campaign Info" ? "1fr 1fr" : "1fr", gap: 16 }}>
                {visibleFields.map((f) => (
                  <div key={f.key} style={{ gridColumn: f.area || f.array ? "1 / -1" : "auto" }}>
                    <ReviewField f={f} v={data[f.key]} onChange={(e) => set(f.key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 1, background: C.border }} />
      <div style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, borderRadius: "0 0 8px 8px" }}>
        <BtnOutline onClick={onBack}>← Back</BtnOutline>
        <BtnPrimary onClick={() => onConfirm(data)}>Generate Campaign ↗</BtnPrimary>
      </div>
    </div>
  );
};

// ── Campaign Output ───────────────────────────────────────────
const useCopy = () => {
  const [copied, setCopied] = useState("");
  const copy = (t, k) => { navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 2000); };
  return { copied, copy };
};

const CopyBtn = ({ text, id, copied, copy }) => (
  <button
    onClick={() => copy(text, id)}
    title="Copy"
    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: copied === id ? C.orange : C.light, display: "flex", alignItems: "center" }}
  >
    {copied === id
      ? <Check size={14} strokeWidth={2.5} />
      : <Copy size={14} strokeWidth={2} />
    }
  </button>
);

const ContentBlock = ({ label, children, copyText, copied, copy, id }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: C.light, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F }}>{label}</div>
      {copyText && <CopyBtn text={copyText} id={id} copied={copied} copy={copy} />}
    </div>
    {children}
  </div>
);

const LinkedInCard = ({ phase, i, copied, copy }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: "20px 24px", background: hovered ? "#FFF8F0" : C.white, transition: "background 0.2s ease" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.orange, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: C.orange, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: F }}>{phase.label}</span>
        </div>
        <CopyBtn text={`${phase.hook}\n\n${phase.body}\n\n${phase.cta}`} id={`li-${i}`} copied={copied} copy={copy} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: C.black, marginBottom: 10, lineHeight: 1.5, fontFamily: F }}>{phase.hook}</div>
      <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.7, marginBottom: 12, fontFamily: F, fontWeight: 300 }}>{phase.body}</div>
      <div style={{ fontSize: 12, color: C.orange, fontFamily: F }}>{phase.cta}</div>
    </div>
  );
};

const TABS = ["Landing Page", "LinkedIn", "Email"];

const CampaignOutput = ({ campaign, qualityCheck, meta, extracted, onReset, onRegenerate, regenerating }) => {
  const [activeTab, setActiveTab] = useState(0);
  const { copied, copy } = useCopy();
  const { landing_page: lp, linkedin, email } = campaign;
  const { score, issues, suggestions } = qualityCheck;

  const exportAll = () => {
    const txt = ["=== LANDING PAGE ===", `Headline: ${lp.headline}`, `Subheadline: ${lp.subheadline}`, `Body: ${lp.body_copy}`, `CTA: ${lp.cta_text}`, "", "=== LINKEDIN ===", ...Object.values(linkedin).map((p) => `[${p.label}]\nHook: ${p.hook}\nBody: ${p.body}\nCTA: ${p.cta}`), "", "=== EMAIL ===", `Subject: ${email.subject_line}`, `Preview: ${email.preview_text}`, `Body: ${email.body}`, `CTA: ${email.cta_text}`].join("\n");
    copy(txt, "all");
  };

  return (
    <div>
      {/* Output card */}
      <div style={{ background: C.white, borderRadius: 8, border: `1px solid ${C.border}` }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "0 32px", width: "100%", boxSizing: "border-box" }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{ padding: "16px 0", flex: 1, textAlign: "center", background: "none", border: "none", borderBottom: `2px solid ${activeTab === i ? C.orange : "transparent"}`, color: activeTab === i ? C.dark : C.light, fontWeight: activeTab === i ? 500 : 400, fontSize: 13, cursor: "pointer", fontFamily: F, transition: "all 0.15s" }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ padding: "28px 32px" }}>
          {/* Landing Page */}
          {activeTab === 0 && (
            <div>
              <ContentBlock label="Headline" copyText={lp.headline} id="lp-h" copied={copied} copy={copy}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.black, lineHeight: 1.4, fontFamily: F }}>{lp.headline}</div>
              </ContentBlock>
              <ContentBlock label="Subheadline" copyText={lp.subheadline} id="lp-s" copied={copied} copy={copy}>
                <div style={{ fontSize: 15, color: C.mid, lineHeight: 1.65, fontFamily: F, fontWeight: 300, fontStyle: "italic" }}>{lp.subheadline}</div>
              </ContentBlock>
              <ContentBlock label="Body Copy" copyText={lp.body_copy} id="lp-b" copied={copied} copy={copy}>
                <div style={{ fontSize: 14, color: C.dark, lineHeight: 1.8, whiteSpace: "pre-line", fontFamily: F }}>{lp.body_copy}</div>
              </ContentBlock>
              <ContentBlock label="CTA Button">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", background: C.orange, color: C.white, borderRadius: 6, fontWeight: 500, fontSize: 14, fontFamily: F }}>
                  {lp.cta_text} ↗
                </div>
              </ContentBlock>
            </div>
          )}

          {/* LinkedIn */}
          {activeTab === 1 && (
            <div style={{ display: "grid", gap: 12 }}>
              {Object.values(linkedin).map((phase, i) => (
                <LinkedInCard key={i} phase={phase} i={i} copied={copied} copy={copy} />
              ))}
            </div>
          )}

          {/* Email */}
          {activeTab === 2 && (
            <div>
              <ContentBlock label="Subject Line" copyText={email.subject_line} id="email-subject" copied={copied} copy={copy}>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.black, fontFamily: F }}>{email.subject_line}</div>
              </ContentBlock>

              <ContentBlock label="Preview Text" copyText={email.preview_text} id="email-preview" copied={copied} copy={copy}>
                <div style={{ fontSize: 13, color: C.black, fontFamily: F, fontStyle: "italic" }}>{email.preview_text}</div>
              </ContentBlock>

              <ContentBlock label="Body" copyText={email.body} id="email-body" copied={copied} copy={copy}>
                <div style={{ fontSize: 13, color: C.dark, lineHeight: 2, whiteSpace: "pre-line", fontFamily: F, borderLeft: `2px solid ${C.orange}`, paddingLeft: 16 }}>{email.body}</div>
              </ContentBlock>

              <ContentBlock label="CTA Button">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", background: C.orange, color: C.white, borderRadius: 6, fontWeight: 500, fontSize: 14, fontFamily: F }}>
                  {email.cta_text} ↗
                </div>
              </ContentBlock>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, borderRadius: "0 0 8px 8px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <BtnOutline onClick={exportAll}>
              {copied === "all" ? "Copied" : "Copy all"}
              {copied === "all"
                ? <Check size={13} strokeWidth={2.5} style={{ verticalAlign: "middle" }} />
                : <Copy size={13} strokeWidth={2} style={{ verticalAlign: "middle" }} />
              }
            </BtnOutline>
            <BtnOutline onClick={() => downloadWord(campaign, extracted)}>
              Download Word <Download size={13} strokeWidth={2} style={{ verticalAlign: "middle" }} />
            </BtnOutline>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <BtnOutline onClick={onRegenerate} disabled={regenerating}>
              {regenerating ? "Regenerating..." : "Regenerate"} <RefreshCw size={13} strokeWidth={2} style={{ verticalAlign: "middle" }} />
            </BtnOutline>
            <BtnPrimary onClick={onReset}>
              New Campaign ↗
            </BtnPrimary>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: C.light, textAlign: "center", marginTop: 12, fontFamily: F }}>
        {meta.model} · {meta.provider} · {new Date(meta.generated_at).toLocaleString("en-GB")}
      </div>
    </div>
  );
};

// ── App Root ─────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [lastForm, setLastForm] = useState(null);

  const runGenerate = async (formData, isRegen = false) => {
    isRegen ? setRegenerating(true) : setLoading(true);
    setError(null);
    try {
      const data = await generateCampaign(formData);
      if (!data.success) throw new Error(data.error || "Workflow failed");
      setResult(data);
      setLastForm(formData);
      if (!isRegen) setStep(1);
    } catch (e) {
      setError(e.message || "Something went wrong. Make sure the n8n webhook is active.");
    } finally {
      isRegen ? setRegenerating(false) : setLoading(false);
    }
  };

  const handleReset = () => { setStep(0); setResult(null); setError(null); setLastForm(null); };

  return (
    <div style={{ fontFamily: F, background: C.cream, minHeight: "100vh", padding: "32px 40px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                {[0,1,2,3].map(i => <div key={i} style={{ width: 7, height: 7, background: C.orange, borderRadius: 1 }} />)}
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.black, fontFamily: F }}>Normec</span>
            </div>
            <div style={{ fontSize: 11, color: C.light, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: F, marginBottom: 4 }}>Internal Tool</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: C.black, margin: 0, fontFamily: F }}>AI Campaign Generator</h1>
            <p style={{ fontSize: 14, color: C.mid, margin: "6px 0 0", fontFamily: F, fontWeight: 300 }}>BMC → Landing Page · LinkedIn · Email</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: USE_MOCK ? "#F5A623" : C.orange }} />
            <span style={{ fontSize: 12, color: C.mid, fontFamily: F }}>{USE_MOCK ? "Mock mode" : "Live"}</span>
          </div>
        </div>

        <Stepper current={step} />

        {error && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.orange}`, borderRadius: 6, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: C.dark, fontFamily: F }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.light, fontFamily: F, fontSize: 16 }}>✕</button>
          </div>
        )}

        {step === 0 && <BMCForm onSubmit={(f) => runGenerate(f)} loading={loading} />}
        {step === 1 && result && (
          <ExtractionReview
            formData={lastForm}
            extracted={result.extracted}
            onConfirm={(edited) => { setLastForm(edited); setStep(2); }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && result && (
          <CampaignOutput
            campaign={result.campaign}
            qualityCheck={result.qualityCheck}
            meta={result.meta}
            extracted={result.extracted}
            onReset={handleReset}
            onRegenerate={() => runGenerate(lastForm, true)}
            regenerating={regenerating}
          />
        )}
      </div>
    </div>
  );
}