# 🎯 Normec AI Campaign Generator
> From Business Model Canvas to Full Campaign — Automatically.

Built by **Prompt Pirates** for the AI Automation Hackathon.

🔗 **Live Demo:** [https://project-dvj4e.vercel.app](https://project-dvj4e.vercel.app)

---

## 📖 About

The **Normec AI Campaign Generator** is an AI-powered tool that transforms a Business Model Canvas (BMC) into a complete marketing campaign package in under a minute.

Designed for Normec — an international organisation in Testing, Inspection, Certification, and Compliance (TICC) — this tool eliminates repetitive manual work and ensures consistent, high-quality campaign output across all business units.

---

## 🚀 Features

- **BMC Input** — Fill in the form manually or upload a PDF
- **AI Extraction** — Automatically identifies key proposition, target audience, and messaging
- **Full Campaign Output** including:
  - 🖥️ Landing page (headline, subheadline, body copy, CTA)
  - 💼 3 LinkedIn ad phases (Awareness, Consideration, Conversion)
  - 📧 Email draft (subject line, preview text, body copy)
- **Multi-language support** — English & Bahasa Indonesia
- **Tone selector** — Professional, Urgent, or Educational
- **Export options** — Copy per section, copy all, or download as Word document

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Automation | n8n (workflow automation) |
| AI | Groq + LLaMA (extraction & generation) |
| Deployment | Vercel |

---

## ⚙️ How It Works

```
[BMC Input] → [AI Extraction] → [Campaign Package]
```

1. **BMC Upload** — User inputs the Business Model Canvas via form or PDF upload
2. **AI Extraction** — AI identifies key proposition, target audience, and messaging
3. **Campaign Generation** — Full campaign package is generated and displayed across three tabs: Landing Page, LinkedIn, and Email

---

## 🏃 Getting Started

### Prerequisites
- Node.js >= 18
- n8n instance (self-hosted or cloud)
- Groq API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/normec-campaign-generator.git
cd normec-campaign-generator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your GROQ_API_KEY and N8N_WEBHOOK_URL in .env

# Run the development server
npm run dev
```

### Environment Variables

```env
VITE_N8N_WEBHOOK_URL=your_n8n_webhook_url
VITE_GROQ_API_KEY=your_groq_api_key
```

---

## 🗺️ Roadmap

- [ ] Platform integration (Contentful, Copernica, LinkedIn Ads Manager)
- [ ] Multi-format BMC input (Excel, Word, PowerPoint, OCR for handwritten)
- [ ] Campaign history & performance comparison
- [ ] Full campaign management dashboard

---

## 👥 Team

| Name | Role |
|---|---|
| Kharisma Sari Dewi | — |
| Maharani Ria Sina | — |
| Yonaka Titin Nur Cahyani | — |

---

## 📄 License

This project was built for the AI Automation Hackathon. All rights reserved.