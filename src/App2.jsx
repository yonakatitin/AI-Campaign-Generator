import { useState, useRef } from "react";

const ubuntuLink = document.createElement("link");
ubuntuLink.rel = "stylesheet";
ubuntuLink.href = "https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap";
document.head.appendChild(ubuntuLink);

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
  if (USE_MOCK) { await new Promise((r) => setTimeout(r, 2500)); return MOCK_RESPONSE; }
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
      phase_1: { label: "Phase 1 · Awareness", color: "#EE7203", hook: "73% of food manufacturers fail their first international audit — here's why.", body: "International buyers are tightening requirements. Most manufacturers don't know their compliance gaps until it's too late — costing them contracts, delays, and fines.", cta: "Read: 5 Signs Your Facility Needs a Compliance Review →" },
      phase_2: { label: "Phase 2 · Consideration", color: "#333333", hook: "What does a 10-day certification process actually look like?", body: "We walk you through every step — from gap analysis to final audit — with a dedicated Normec expert by your side. No guesswork, no delays, no surprises.", cta: "Download our FoodSafe Certification Roadmap →" },
      phase_3: { label: "Phase 3 · Conversion", color: "#111111", hook: "Your competitors are already certified. Are you?", body: "Normec has helped 200+ food manufacturers in Southeast Asia achieve international certification. Our next onboarding cohort starts April 2026 — limited spots available.", cta: "Book a Free Consultation — Limited Spots Available →" },
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

// ── Colors & Font ─────────────────────────────────────────────
const C = {
  primary:  "#EE7203",  // orange
  cream:    "#FBF7F4",  // cream background
  black:    "#111111",  // near black
  dark:     "#2A2A2A",  // dark gray (headers, text)
  mid:      "#555555",  // medium gray (subtext)
  muted:    "#999999",  // muted labels
  border:   "#E8E0D8",  // warm border
  surface:  "#FFF9F5",  // card surface
  danger:   "#CC3300",  // red for errors
};

const FONT = "'Ubuntu', sans-serif";

const Label = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontFamily: FONT }}>
    {children}
  </div>
);

const Badge = ({ children, color }) => (
  <span style={{ background: `${color}18`, color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600, fontFamily: FONT }}>
    {children}
  </span>
);

const useCopy = () => {
  const [copied, setCopied] = useState("");
  const copy = (t, k) => { navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 2000); };
  return { copied, copy };
};

const CopyBtn = ({ text, id, copied, copy }) => (
  <button onClick={() => copy(text, id)} style={{ fontSize: 11, color: copied === id ? C.primary : C.muted, background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: FONT }}>
    {copied === id ? "✓ Copied!" : "Copy"}
  </button>
);

// ── Stepper ──────────────────────────────────────────────────
const STEPS = ["Input BMC", "Review Extraction", "Campaign Output"];
const Stepper = ({ current }) => (
  <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
    {STEPS.map((s, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: i < current ? C.primary : i === current ? C.black : C.border, color: i <= current ? "#fff" : C.muted, fontWeight: 700, fontSize: 13, flexShrink: 0, fontFamily: FONT }}>
            {i < current ? "✓" : i + 1}
          </div>
          <span style={{ fontSize: 13, fontWeight: i === current ? 700 : 400, color: i === current ? C.black : C.muted, whiteSpace: "nowrap", fontFamily: FONT }}>{s}</span>
        </div>
        {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < current ? C.primary : C.border, margin: "0 10px" }} />}
      </div>
    ))}
  </div>
);

// ── Download Word ────────────────────────────────────────────
const downloadWord = (campaign, extracted) => {
  const { landing_page: lp, linkedin, email } = campaign;
  const liPhases = Object.values(linkedin).map((p) =>
    `<div class="phase-box">
      <h3 style="color:${p.color}">${p.label}</h3>
      <p><b>Hook:</b> ${p.hook}</p>
      <p><b>Body:</b> ${p.body}</p>
      <p><b>CTA:</b> <span style="color:#EE7203">${p.cta}</span></p>
    </div>`
  ).join("");
  const html = `
    <html><head><meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Ubuntu', Calibri, sans-serif; margin: 40px; color: #2A2A2A; background: #FBF7F4; font-size: 13px; line-height: 1.6; }
      h1 { color: #EE7203; font-size: 22px; border-bottom: 3px solid #EE7203; padding-bottom: 8px; margin-bottom: 4px; }
      h2 { color: #111111; font-size: 15px; border-bottom: 2px solid #EE7203; padding-bottom: 5px; margin-top: 28px; }
      h3 { color: #2A2A2A; font-size: 13px; margin-bottom: 6px; }
      .meta { color: #999; font-size: 12px; margin-bottom: 24px; }
      .cta { background: #EE7203; color: white; padding: 8px 18px; border-radius: 6px; display: inline-block; font-weight: bold; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 8px; }
      td { padding: 10px 14px; border: 1px solid #E8E0D8; vertical-align: top; }
      td:first-child { background: #FFF9F5; font-weight: 600; color: #555; width: 160px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
      .phase-box { border: 1.5px solid #E8E0D8; border-radius: 8px; padding: 16px 20px; margin-bottom: 10px; background: #FFF9F5; }
    </style>
    </head><body>
    <h1>Normec AI Campaign Generator</h1>
    <p class="meta"><b>Entity:</b> ${extracted.entity || "-"} &nbsp;·&nbsp; <b>Generated:</b> ${new Date().toLocaleDateString("en-GB")}</p>

    <h2>🖥️ Landing Page</h2>
    <table>
      <tr><td>Headline</td><td><b style="font-size:15px">${lp.headline}</b></td></tr>
      <tr><td>Subheadline</td><td>${lp.subheadline}</td></tr>
      <tr><td>Body Copy</td><td>${lp.body_copy.replace(/\n/g, "<br/>")}</td></tr>
      <tr><td>CTA Button</td><td><span class="cta">${lp.cta_text}</span></td></tr>
    </table>

    <h2>💼 LinkedIn Campaign (3 Phases)</h2>
    ${liPhases}

    <h2>📧 Email (Copernica)</h2>
    <table>
      <tr><td>Subject Line</td><td><b>${email.subject_line}</b></td></tr>
      <tr><td>Preview Text</td><td>${email.preview_text}</td></tr>
      <tr><td>Body</td><td>${email.body.replace(/\n/g, "<br/>")}</td></tr>
      <tr><td>CTA Button</td><td><span class="cta">${email.cta_text}</span></td></tr>
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
      { key: "date", label: "Date", placeholder: "e.g. March 2026", type: "date" },
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

// ── Reusable Field Input ──────────────────────────────────────
const FieldInput = ({ f, value, onChange }) => {
  const style = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: `1.5px solid ${value ? C.primary : C.border}`,
    fontSize: 13, color: C.dark, outline: "none",
    boxSizing: "border-box", fontFamily: FONT, background: "#fff",
  };
  return f.area
    ? <textarea value={value || ""} onChange={onChange} placeholder={f.placeholder} rows={2} style={{ ...style, resize: "vertical" }} />
    : <input type={f.type || "text"} value={value || ""} onChange={onChange} placeholder={f.placeholder} style={style} />;
};

// ── Section Header helper ─────────────────────────────────────
const SectionHeader = ({ label, isOptional }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, paddingBottom: 6, borderBottom: `2px solid ${C.primary}`, fontFamily: FONT }}>
    {label}
    {isOptional && <span style={{ fontSize: 11, fontWeight: 400, color: C.muted, marginLeft: 8, textTransform: "none", letterSpacing: 0 }}>— optional</span>}
  </div>
);

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
    <div style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.black, marginBottom: 4, fontFamily: FONT }}>Business Model Canvas Input</h2>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, fontFamily: FONT }}>
        Fill in the Normec BMC template or upload a completed PDF — AI will generate your full campaign automatically.
      </p>

      {/* Toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[{ id: "text", label: "✏️ Fill Manually" }, { id: "pdf", label: "📄 Upload PDF" }].map((m) => (
          <button key={m.id} onClick={() => setInputMethod(m.id)} style={{ padding: "7px 18px", borderRadius: 8, border: `1.5px solid ${inputMethod === m.id ? C.primary : C.border}`, background: inputMethod === m.id ? `${C.primary}12` : "#fff", color: inputMethod === m.id ? C.primary : C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Manual Form */}
      {inputMethod === "text" && (
        <>
          {BMC_MANUAL_SECTIONS.map((section) => (
            <div key={section.section} style={{ marginBottom: 24 }}>
              <SectionHeader label={section.section} isOptional={!!section.optional} />
              {section.fields.map((f) => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5, fontFamily: FONT }}>
                    {f.label} {f.required && <span style={{ color: C.primary }}>*</span>}
                  </label>
                  <FieldInput f={f} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} />
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* PDF Upload */}
      {inputMethod === "pdf" && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader label="Business Model Canvas" />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => !pdfParsing && fileRef.current.click()}
            style={{ border: `2px dashed ${dragOver ? C.primary : pdfText ? C.dark : fileName ? C.muted : `${C.primary}50`}`, borderRadius: 12, padding: 32, textAlign: "center", background: dragOver ? `${C.primary}06` : pdfText ? `${C.black}04` : C.cream, cursor: pdfParsing ? "wait" : "pointer", transition: "all 0.2s", marginBottom: 20 }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>{pdfParsing ? "⏳" : pdfText ? "✅" : "📄"}</div>
            {pdfParsing ? (
              <><div style={{ fontWeight: 700, color: C.dark, fontFamily: FONT }}>Parsing PDF...</div><div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontFamily: FONT }}>Extracting text from your BMC document</div></>
            ) : pdfText ? (
              <><div style={{ fontWeight: 700, color: C.black, marginBottom: 4, fontFamily: FONT }}>{fileName}</div><div style={{ fontSize: 12, color: C.muted, fontFamily: FONT }}>✓ PDF parsed successfully · {pdfText.length} characters extracted · Click to replace</div></>
            ) : fileName ? (
              <><div style={{ fontWeight: 700, color: C.muted, fontFamily: FONT }}>{fileName}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontFamily: FONT }}>Parsing failed — click to try another file</div></>
            ) : (
              <><div style={{ fontWeight: 600, color: C.primary, marginBottom: 4, fontFamily: FONT }}>Drag & drop your BMC PDF here</div><div style={{ fontSize: 12, color: C.muted, fontFamily: FONT }}>or click to browse · PDF only · Max 10MB</div></>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />

          <SectionHeader label="Service Details" isOptional={true} />
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 16, fontFamily: FONT }}>
            Optionally add service info to complement the PDF — useful if the BMC doesn't include full service details.
          </p>
          {SERVICE_DETAIL_FIELDS.map((f) => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: "block", marginBottom: 5, fontFamily: FONT }}>{f.label}</label>
              <FieldInput f={f} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} />
            </div>
          ))}
        </div>
      )}

      {/* Tone */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: "block", marginBottom: 8, fontFamily: FONT }}>Communication Tone</label>
        <div style={{ display: "flex", gap: 8 }}>
          {["professional", "urgent", "educational"].map((t) => (
            <button key={t} onClick={() => setTone(t)} style={{ padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${tone === t ? C.primary : C.border}`, background: tone === t ? `${C.primary}12` : "#fff", color: tone === t ? C.primary : C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize", fontFamily: FONT }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading || !isValid} style={{ width: "100%", padding: 13, background: loading || !isValid ? C.muted : C.primary, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading || !isValid ? "not-allowed" : "pointer", fontFamily: FONT }}>
        {loading ? "⏳ Generating Campaign..." : "⚡ Extract & Generate Campaign"}
      </button>
      {!isValid && (
        <p style={{ fontSize: 12, color: C.primary, marginTop: 8, textAlign: "center", fontFamily: FONT }}>
          {inputMethod === "pdf" ? "⚠ Please upload a PDF file first" : "⚠ Please fill in all required fields (marked with *)"}
        </p>
      )}
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
      { key: "tone", label: "Communication Tone" },
      { key: "campaign_language", label: "Campaign Language" },
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

const ExtractionReview = ({ formData, extracted, onConfirm, onBack }) => {
  const isPdf = formData?.input_method === "pdf";
  const [data, setData] = useState({ ...formData, ...extracted });
  const set = (k, v) => setData((p) => ({ ...p, [k]: v }));

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.black, marginBottom: 4, fontFamily: FONT }}>
          {isPdf ? "Review AI Extraction" : "Review Your Input"}
        </h2>
        <p style={{ fontSize: 13, color: C.muted, fontFamily: FONT }}>
          {isPdf ? "AI has extracted the following data from your PDF. Edit if needed before generating the campaign."
                  : "Please review all the data you have entered. Edit if needed before generating the campaign."}
        </p>
        {isPdf && (
          <div style={{ marginTop: 10, background: `${C.primary}10`, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: C.primary, fontWeight: 600, fontFamily: FONT }}>
            📄 Source: PDF extraction — {formData?.pdf_text?.length || 0} characters parsed
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 24 }}>
        {REVIEW_SECTIONS.map((section) => {
          const visibleFields = section.alwaysShow
            ? section.fields
            : section.fields.filter((f) => {
                const v = data[f.key];
                if (!v) return false;
                if (Array.isArray(v)) return v.length > 0;
                return String(v).trim() !== "" && String(v).trim() !== "-";
              });
          if (visibleFields.length === 0) return null;
          return (
            <div key={section.section}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, paddingBottom: 6, borderBottom: `2px solid ${C.primary}`, fontFamily: FONT }}>
                {section.section}
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {visibleFields.map((f) => {
                  const v = data[f.key];
                  const isEmpty = !v || (typeof v === "string" && (v.trim() === "" || v.trim() === "-"));
                  return (
                    <div key={f.key} style={{ background: isEmpty ? C.cream : C.surface, borderRadius: 8, padding: "12px 16px", border: `1px solid ${isEmpty ? C.border : `${C.primary}25`}` }}>
                      <Label>{f.label}</Label>
                      {f.array && Array.isArray(v) ? (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                          {v.length > 0
                            ? v.map((item, i) => <Badge key={i} color={C.primary}>{item}</Badge>)
                            : <span style={{ fontSize: 13, color: C.muted, fontFamily: FONT }}>—</span>}
                        </div>
                      ) : f.area ? (
                        <textarea value={isEmpty ? "" : (v || "")} onChange={(e) => set(f.key, e.target.value)} placeholder="—" rows={2}
                          style={{ width: "100%", fontSize: 13, color: isEmpty ? C.muted : C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px", boxSizing: "border-box", resize: "vertical", fontFamily: FONT, background: "#fff" }} />
                      ) : (
                        <input value={isEmpty ? "" : (v || "")} onChange={(e) => set(f.key, e.target.value)} placeholder="—"
                          style={{ width: "100%", fontSize: 13, color: isEmpty ? C.muted : C.dark, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px", boxSizing: "border-box", fontFamily: FONT, background: "#fff" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button onClick={onBack} style={{ flex: 1, padding: 12, background: C.cream, color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>← Back</button>
        <button onClick={() => onConfirm(data)} style={{ flex: 2, padding: 12, background: C.primary, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: FONT }}>🚀 Generate Campaign</button>
      </div>
    </div>
  );
};

// ── Campaign Output ───────────────────────────────────────────
const TABS = [{ id: "landing", label: "🖥️ Landing Page" }, { id: "linkedin", label: "💼 LinkedIn" }, { id: "email", label: "📧 Email" }];

const CampaignOutput = ({ campaign, qualityCheck, meta, extracted, onReset, onRegenerate, regenerating }) => {
  const [activeTab, setActiveTab] = useState("landing");
  const { copied, copy } = useCopy();
  const { landing_page: lp, linkedin, email } = campaign;
  const { score, issues, suggestions } = qualityCheck;
  const barColor = score >= 80 ? C.primary : score >= 60 ? C.mid : C.danger;

  const exportAll = () => {
    const txt = ["=== LANDING PAGE ===", `Headline: ${lp.headline}`, `Subheadline: ${lp.subheadline}`, `Body: ${lp.body_copy}`, `CTA: ${lp.cta_text}`, "", "=== LINKEDIN ===", ...Object.values(linkedin).map((p) => `[${p.label}]\nHook: ${p.hook}\nBody: ${p.body}\nCTA: ${p.cta}`), "", "=== EMAIL ===", `Subject: ${email.subject_line}`, `Preview: ${email.preview_text}`, `Body: ${email.body}`, `CTA: ${email.cta_text}`].join("\n");
    copy(txt, "all");
  };

  return (
    <div>
      {/* Quality Score */}
      <div style={{ background: `linear-gradient(135deg, ${C.black}, #3A3A3A)`, borderRadius: 12, padding: "18px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ color: "#999", fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FONT }}>Campaign Quality Score</div>
            <div style={{ color: "#fff", fontSize: 28, fontWeight: 800, fontFamily: FONT }}>{score} <span style={{ fontSize: 13, color: "#999" }}>/ 100</span></div>
            <div style={{ color: "#aaa", fontSize: 11, marginTop: 4, fontFamily: FONT }}>
              {score >= 80 ? "Ready to review & publish" : score >= 60 ? "Good — consider the suggestions below" : "Needs improvement before publishing"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {issues.length === 0 && <div style={{ color: C.primary, fontWeight: 600, fontSize: 13, fontFamily: FONT }}>✓ No critical issues</div>}
            {issues.map((issue, i) => <div key={i} style={{ color: "#FF8080", fontWeight: 600, fontSize: 12, fontFamily: FONT }}>⚠ {issue}</div>)}
            {suggestions.map((s, i) => <div key={i} style={{ color: "#FFD080", fontWeight: 600, fontSize: 12, fontFamily: FONT }}>💡 {s}</div>)}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 4, height: 6 }}>
          <div style={{ background: barColor, height: "100%", borderRadius: 4, width: `${score}%`, transition: "width 1s ease" }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "9px 18px", borderRadius: 8, border: `1.5px solid ${activeTab === t.id ? C.primary : C.border}`, background: activeTab === t.id ? C.primary : "#fff", color: activeTab === t.id ? "#fff" : C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", marginBottom: 12 }}>
        {/* Landing Page */}
        {activeTab === "landing" && (
          <div>
            {[{ label: "Headline", content: lp.headline, key: "lp-h", large: true }, { label: "Subheadline", content: lp.subheadline, key: "lp-s" }, { label: "Body Copy", content: lp.body_copy, key: "lp-b" }].map((f) => (
              <div key={f.key} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Label>{f.label}</Label>
                  <CopyBtn text={f.content} id={f.key} copied={copied} copy={copy} />
                </div>
                <div style={{ fontSize: f.large ? 20 : 14, fontWeight: f.large ? 700 : 400, color: f.large ? C.black : C.dark, lineHeight: 1.65, background: C.surface, padding: "12px 14px", borderRadius: 8, whiteSpace: "pre-line", fontFamily: FONT }}>{f.content}</div>
              </div>
            ))}
            <Label>CTA Button</Label>
            <div style={{ background: C.primary, borderRadius: 8, padding: "12px 20px", display: "inline-block", color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: FONT }}>{lp.cta_text}</div>
          </div>
        )}

        {/* LinkedIn */}
        {activeTab === "linkedin" && (
          <div style={{ display: "grid", gap: 16 }}>
            {Object.values(linkedin).map((phase, i) => (
              <div key={i} style={{ borderRadius: 10, padding: 18, border: `1.5px solid ${phase.color}25`, background: i === 0 ? `${C.primary}06` : C.cream }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Badge color={phase.color}>{phase.label}</Badge>
                  <CopyBtn text={`${phase.hook}\n\n${phase.body}\n\n${phase.cta}`} id={`li-${i}`} copied={copied} copy={copy} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.black, marginBottom: 8, fontFamily: FONT }}>{phase.hook}</div>
                <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.65, marginBottom: 10, fontFamily: FONT }}>{phase.body}</div>
                <div style={{ fontSize: 12, color: phase.color, fontWeight: 600, fontFamily: FONT }}>{phase.cta}</div>
              </div>
            ))}
          </div>
        )}

        {/* Email */}
        {activeTab === "email" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <CopyBtn text={`Subject: ${email.subject_line}\n\n${email.body}\n\nCTA: ${email.cta_text}`} id="email-all" copied={copied} copy={copy} />
            </div>
            {[{ label: "Subject Line", content: email.subject_line, bg: C.surface }, { label: "Preview Text", content: email.preview_text, bg: C.cream }].map((f) => (
              <div key={f.label} style={{ background: f.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                <Label>{f.label}</Label>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, fontFamily: FONT }}>{f.content}</div>
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Label>Email Body</Label>
                <CopyBtn text={email.body} id="email-body" copied={copied} copy={copy} />
              </div>
              <div style={{ fontSize: 14, color: C.dark, lineHeight: 1.8, whiteSpace: "pre-line", background: C.surface, padding: 14, borderRadius: 8, fontFamily: FONT }}>{email.body}</div>
            </div>
            <Label>CTA Button</Label>
            <div style={{ background: C.primary, borderRadius: 8, padding: "12px 20px", display: "inline-block", color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: FONT }}>{email.cta_text}</div>
          </div>
        )}
      </div>

      {/* Meta */}
      <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginBottom: 12, fontFamily: FONT }}>
        Generated by {meta.model} · {meta.provider} · {new Date(meta.generated_at).toLocaleString("en-GB")}
      </div>

      {/* Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
        <button onClick={exportAll} style={{ padding: 11, background: C.cream, color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>
          {copied === "all" ? "✓ Copied!" : "📋 Copy All"}
        </button>
        <button onClick={() => downloadWord(campaign, extracted)} style={{ padding: 11, background: C.cream, color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>
          📥 Download Word
        </button>
        <button onClick={onRegenerate} disabled={regenerating} style={{ padding: 11, background: regenerating ? C.muted : C.cream, color: regenerating ? "#fff" : C.dark, border: `1.5px solid ${regenerating ? C.muted : C.border}`, borderRadius: 10, fontWeight: 600, cursor: regenerating ? "not-allowed" : "pointer", fontSize: 12, fontFamily: FONT }}>
          {regenerating ? "⏳ Regenerating..." : "🔄 Regenerate"}
        </button>
        <button onClick={onReset} style={{ padding: 11, background: C.primary, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>
          ⚡ New Campaign
        </button>
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
    <div style={{ fontFamily: FONT, background: C.cream, minHeight: "100vh", padding: "24px 32px" }}>
      <div style={{ width: "100%" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.black}, #3A3A3A)`, borderRadius: 12, padding: "20px 28px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#888", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, fontFamily: FONT }}>Normec · Internal Tool</div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, fontFamily: FONT }}>AI Campaign Generator</div>
            <div style={{ color: "#888", fontSize: 12, marginTop: 2, fontFamily: FONT }}>BMC → Landing Page · LinkedIn · Email</div>
          </div>
          <div style={{ background: USE_MOCK ? "#fef3c7" : `${C.primary}25`, borderRadius: 8, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: USE_MOCK ? "#92400e" : C.primary, fontFamily: FONT }}>
            {USE_MOCK ? "⚠ MOCK MODE" : "✓ LIVE"}
          </div>
        </div>

        <Stepper current={step} />

        {error && (
          <div style={{ background: "#FFF0E8", border: `1px solid ${C.primary}50`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: C.primary, fontSize: 13, display: "flex", justifyContent: "space-between", fontFamily: FONT }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.primary, fontWeight: 700, fontFamily: FONT }}>✕</button>
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