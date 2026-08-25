"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { mechanicalServices, services, softwareServices } from "./service-data";
import type { Service } from "./service-data";

type Action = { label: string; query?: string; href?: string };
type Message = { from: "bot" | "user"; text: string; actions?: Action[]; time: string };

const STORAGE_KEY = "arch-website-chat-v3";
const aliases: Record<string, string> = {
  "3d-modelling-drafting": "3d model 3d modelling modeling 2d drafting cad drafting inventor solidworks",
  "sheet-metal-design": "sheet metal fabrication bend bending flat pattern dxf",
  "new-product-development": "product development new product npd prototype concept",
  "reverse-engineering": "reverse engineering scan to cad scanning physical part recreate",
  digitization: "digitization digitisation digitalization blueprint paper drawing pdf conversion",
  "cad-automation": "cad automation ilogic inventor rules macros configurator batch pdf dxf dwg",
  "plant-engineering": "plant engineering piping layout equipment layout facility",
  "structural-engineering": "structural engineering steel structure fabrication",
  "bim-services": "bim building information modelling revit mep",
  "cad-ams": "cad ams application management support maintenance standards",
  "mechanical-drawings": "mechanical drawing engineering drawing shop fabrication technical drawing",
  "tolerance-gdt": "tolerance tolerancing gdt gd&t stack up datum",
  "web-applications": "web app website web application portal ecommerce next react",
  "mobile-apps": "mobile app android ios flutter react native",
  "custom-software": "custom software desktop app desktop application business software c# python",
  "erp-crm": "erp crm customer project operations management",
  "ui-ux-design": "ui ux user interface user experience figma design prototype",
  "api-integration": "api integration rest restful webhook json microservice",
  "cloud-solutions": "cloud aws azure firebase devops deployment hosting",
  "cybersecurity-qa": "cybersecurity cyber security qa testing quality security"
};
const typos: Record<string, string> = {
  comapny: "company", servvices: "services", servies: "services", softwares: "software",
  mechannical: "mechanical", mechnical: "mechanical", engonering: "engineering",
  developement: "development", aplication: "application", ilogics: "ilogic"
};
const stopWords = new Set(["the","a","an","is","are","do","does","you","your","we","our","of","for","to","in","on","and","about","tell","me","please","provide","arch","assistant"]);

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function normalize(value: string) {
  return (value || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9+#.]+/g, " ").trim()
    .split(/\s+/).map(word => typos[word] || word).join(" ");
}
function words(value: string) {
  return normalize(value).split(" ").filter(word => word.length > 1 && !stopWords.has(word));
}
function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = old;
    }
  }
  return row[b.length];
}
function similarity(a: string, b: string) {
  const left = words(a), right = words(b);
  if (!left.length || !right.length) return 0;
  let hits = 0;
  left.forEach(x => {
    let best = 0;
    right.forEach(y => {
      if (x === y) best = Math.max(best, 1);
      else if (x.length > 3 && y.length > 3 && (x.includes(y) || y.includes(x))) best = Math.max(best, .82);
      else if (x.length > 3 && y.length > 3 && distance(x, y) <= Math.max(1, Math.floor(Math.max(x.length, y.length) * .25))) best = Math.max(best, .7);
    });
    hits += best;
  });
  return hits / Math.max(left.length, right.length);
}
function includesAny(value: string, phrases: string[]) {
  return phrases.some(phrase => value.includes(phrase));
}
function numbered(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
function serviceActions(service: Service): Action[] {
  return [
    { label: "Deliverables", query: `What are the deliverables for ${service.title}?` },
    { label: "Tools", query: `What tools are used for ${service.title}?` },
    { label: "Process", query: `What is the process for ${service.title}?` },
    { label: "Request quote", href: "/contact" }
  ];
}
function findService(question: string) {
  const q = normalize(question);
  return services.map(service => {
    const title = normalize(service.title);
    const search = `${service.title} ${service.summary} ${aliases[service.slug] || ""}`;
    let score = similarity(q, search);
    if (q.includes(title)) score += 1.5;
    normalize(aliases[service.slug] || "").split(" ").forEach(alias => {
      if (alias.length > 3 && q.includes(alias)) score += .1;
    });
    return { service, score };
  }).sort((a, b) => b.score - a.score)[0];
}
function categoryAnswer(items: Service[], label: string) {
  return {
    text: `Arch Engineering Services provides these ${label} services:\n\n${numbered(items.map(service => service.title))}\n\nChoose a service below to learn more.`,
    actions: items.slice(0, 8).map(service => ({ label: service.title, query: `Tell me about ${service.title}` }))
  };
}
function serviceAnswer(service: Service, question: string) {
  const q = normalize(question);
  if (includesAny(q, ["deliverable", "what do i get", "output", "files included", "included"])) {
    return { text: `${service.title} deliverables:\n\n${numbered(service.deliverables)}`, actions: serviceActions(service) };
  }
  if (includesAny(q, ["tool", "technology", "technologies", "platform", "software used", "tech stack"])) {
    return { text: `Tools and technologies used for ${service.title}:\n\n${numbered(service.tools)}`, actions: serviceActions(service) };
  }
  if (includesAny(q, ["process", "steps", "how do you work", "how it works", "workflow"])) {
    return { text: `Our ${service.title} process:\n\n${numbered(service.workflow)}`, actions: serviceActions(service) };
  }
  if (includesAny(q, ["cost", "price", "pricing", "charge", "quote", "budget"])) {
    return { text: `Pricing for ${service.title} depends on scope, complexity, file formats, and delivery time. Mechanical support is commonly estimated by project hours. Send the requirements for a tailored quote.`, actions: [{ label: "Request quote", href: "/contact" }, { label: "Contact details", query: "Contact details" }] };
  }
  let bestFaq = { score: 0, answer: "" };
  service.faqs.forEach(([faqQuestion, faqAnswer]) => {
    const score = similarity(question, faqQuestion);
    if (score > bestFaq.score) bestFaq = { score, answer: faqAnswer };
  });
  if (bestFaq.score >= .2) return { text: bestFaq.answer, actions: serviceActions(service) };
  return { text: `${service.title}\n\n${service.summary}\n\nOutcome: ${service.outcome}`, actions: serviceActions(service) };
}

function answer(question: string, recentBotText = ""): { text: string; actions?: Action[] } {
  const q = normalize(question);
  if (!q) return { text: "Please type a question about Arch Engineering Services." };

  // Let visitors choose a service by entering the number shown in the latest category list.
  const numberMatch = q.match(/^(?:number\s*)?(\d{1,2})$/);
  if (numberMatch) {
    const selectedNumber = Number(numberMatch[1]);
    const recent = normalize(recentBotText);
    const category = recent.includes("software development services")
      ? softwareServices
      : recent.includes("mechanical engineering services")
        ? mechanicalServices
        : null;
    if (category && selectedNumber >= 1 && selectedNumber <= category.length) {
      return serviceAnswer(category[selectedNumber - 1], question);
    }
    return {
      text: "Please first choose Mechanical services or Software services, then enter the service number.",
      actions: [
        { label: "Mechanical services", query: "Mechanical services" },
        { label: "Software services", query: "Software services" }
      ]
    };
  }
  if (includesAny(q, ["thank you", "thanks", "thankyou", "appreciate"])) return { text: "You’re welcome! I’m happy to help. Ask me another question anytime." };
  if (includesAny(q, ["bye", "goodbye", "see you", "talk to you later"])) return { text: "Goodbye! Thank you for visiting Arch Engineering Services." };
  if (includesAny(q, ["how are you", "how r u", "how is it going"])) return { text: "I’m doing well, thank you! I’m ready to help with engineering, CAD automation, or software questions." };
  if (includesAny(q, ["who are you", "your name", "are you a bot", "are you human"])) return { text: "I’m Arch Assistant, the virtual website guide for Arch Engineering Services. I can explain services, deliverables, tools, processes, pricing, and contact options." };
  if (includesAny(q, ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"])) return {
    text: "Hello! How can I help with your mechanical engineering or software project?",
    actions: [{ label: "Mechanical services", query: "Mechanical services" }, { label: "Software services", query: "Software services" }, { label: "Request quote", href: "/contact" }]
  };
  if (includesAny(q, ["help me", "can you help", "what can you do", "menu", "options"])) return {
    text: "I can explain Arch’s mechanical and software services, project process, deliverables, tools, pricing, industries, and contact information.",
    actions: [{ label: "All services", query: "What services do you provide?" }, { label: "About Arch", query: "Tell me about Arch" }, { label: "Contact", query: "Contact details" }]
  };
  if ((includesAny(q, ["software", "digital", "technology"]) && includesAny(q, ["service", "solution", "offer", "provide"])) || ["software", "software services"].includes(q)) return categoryAnswer(softwareServices, "software development");
  if ((includesAny(q, ["mechanical", "engineering", "cad"]) && includesAny(q, ["service", "solution", "offer", "provide"])) || ["mechanical", "cad", "mechanical services"].includes(q)) return categoryAnswer(mechanicalServices, "mechanical engineering");

  const match = findService(question);
  const genericServices = includesAny(q, ["what services", "which services", "all services", "services do you provide", "services do you offer", "your services", "company services"]);
  const specificTerms = ["web app","mobile app","custom software","sheet metal","reverse engineering","3d model","2d drafting","cad automation","ilogic","plant engineering","structural engineering","mechanical drawing","product development","cloud","cybersecurity","erp","crm","ui ux","api","bim","digitization","tolerance","gdt"];
  const clearlySpecific = match && (match.score >= .45 || specificTerms.some(term => q.includes(term)));
  if (genericServices && !clearlySpecific) return {
    text: `Arch provides ${mechanicalServices.length} mechanical engineering services and ${softwareServices.length} software development services.\n\nMechanical Engineering:\n${numbered(mechanicalServices.map(service => service.title))}\n\nSoftware Development:\n${numbered(softwareServices.map(service => service.title))}`,
    actions: [{ label: "Mechanical services", query: "Mechanical services" }, { label: "Software services", query: "Software services" }]
  };
  if (includesAny(q, ["tell me about arch", "about company", "company overview", "company profile", "who is arch", "company information"])) return {
    text: "Arch Engineering Services, LLC is a St. Louis engineering and technology company led by Sridhar Kota. We combine about 10 years of mechanical/CAD experience and 8 years of software experience to support manufacturing, construction, automotive, and growing businesses.",
    actions: [{ label: "Why choose Arch?", query: "Why choose Arch?" }, { label: "All services", query: "What services do you provide?" }, { label: "Contact", query: "Contact details" }]
  };
  if (includesAny(q, ["contact", "phone", "email", "address", "location", "where are you", "reach you"])) return {
    text: "Arch Engineering Services, LLC\n315 Lemay Ferry Road\nSt. Louis, MO 63125\nPhone: +1 (314) 706-3946\nEmail: archengservices2022@gmail.com",
    actions: [{ label: "Call now", href: "tel:+13147063946" }, { label: "Email", href: "mailto:archengservices2022@gmail.com" }, { label: "Request quote", href: "/contact" }]
  };
  if (includesAny(q, ["industry", "industries", "sector", "who do you serve"])) return { text: "Arch supports manufacturing, construction, automotive, industrial equipment, fabrication, field-service businesses, and organizations needing custom engineering or software solutions." };
  if (includesAny(q, ["why choose", "why arch", "benefit", "advantage", "quality"])) return { text: "Clients choose Arch for combined mechanical and software expertise, direct senior-level communication, practical automation experience, flexible project support, clear deliverables, and a St. Louis-based partner." };
  if (includesAny(q, ["project process", "your process", "how do you work", "workflow", "project steps"])) return { text: "Our typical project process:\n\n1. Discovery and requirements\n2. Scope and proposal\n3. Design or prototype\n4. Development and review\n5. Quality checks and revisions\n6. Delivery, documentation, and support" };
  if (includesAny(q, ["quote", "pricing", "price", "cost", "estimate", "start project", "how much"])) return {
    text: "Project pricing depends on scope, complexity, required formats, and timing. Mechanical work is generally estimated by project hours, often around $50–$65 per hour after scope review. Use the quote form and Arch will review your requirements.",
    actions: [{ label: "Open quote form", href: "/contact" }, { label: "Call us", href: "tel:+13147063946" }]
  };
  if (includesAny(q, ["tools", "technology", "tech stack", "what software"])) return { text: "Mechanical tools include Autodesk Inventor, iLogic, AutoCAD, and SolidWorks. Software technologies include Python, C#, JavaScript, React/Next.js, Firebase, APIs, and cloud deployment tools." };
  if (match && match.score >= .18) return serviceAnswer(match.service, question);
  return {
    text: "I’m not completely sure what you’re looking for. Tell me whether the need is mechanical CAD, iLogic automation, web/mobile/desktop software, or another engineering challenge.",
    actions: [{ label: "Mechanical services", query: "Mechanical services" }, { label: "Software services", query: "Software services" }, { label: "Request quote", href: "/contact" }]
  };
}

const welcome: Message = {
  from: "bot",
  text: "Hello! I’m Arch Assistant. Ask me about mechanical engineering, CAD and iLogic automation, custom software, deliverables, tools, pricing, or project quotes.",
  actions: [{ label: "Mechanical", query: "Mechanical services" }, { label: "Software", query: "Software services" }, { label: "Get a quote", href: "/contact" }],
  time: ""
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [greeting, setGreeting] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestActions = useMemo(() => [...messages].reverse().find(message => message.from === "bot" && message.actions)?.actions || [], [messages]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20))); } catch {}
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function ask(value: string) {
    const clean = value.trim();
    if (!clean || typing) return;
    setGreeting(false);
    setMessages(current => [...current, { from: "user", text: clean, time: now() }]);
    setText("");
    setTyping(true);
    const recentBotText = [...messages].reverse().find(message => message.from === "bot")?.text || "";
    window.setTimeout(() => {
      const response = answer(clean, recentBotText);
      setMessages(current => [...current, { from: "bot", ...response, time: now() }]);
      setTyping(false);
    }, 450);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    ask(text);
  }
  function clearChat() {
    setMessages([{ ...welcome, time: now() }]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  return <div className="arch-chat">
    {!open && greeting && <button className="chat-greeting" type="button" onClick={() => { setOpen(true); setGreeting(false); }}>Need engineering or software help?</button>}
    {open && <section className="chat-panel" aria-label="Arch Engineering chat assistant">
      <header className="chat-head">
        <img src="/favicon.png" alt="" />
        <span><b>Arch Assistant</b><small><i /> Online · Engineering & software help</small></span>
        <button type="button" onClick={clearChat} aria-label="Clear chat" title="Clear chat">↻</button>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
      </header>
      <div className="chat-messages" ref={scrollRef} aria-live="polite">
        {messages.map((message, index) => <div key={index} className={`chat-row ${message.from}`}>
          {message.from === "bot" && <span className="chat-mini">A</span>}
          <div><p>{message.text}</p>{message.time && <time>{message.time}</time>}</div>
        </div>)}
        {typing && <div className="chat-row bot"><span className="chat-mini">A</span><div className="chat-typing"><i /><i /><i /></div></div>}
      </div>
      <div className="chat-options">
        {latestActions.map(action => action.href
          ? <a key={action.label} href={action.href}>{action.label}</a>
          : <button type="button" key={action.label} onClick={() => ask(action.query || action.label)}>{action.label}</button>
        )}
      </div>
      <form className="chat-input" onSubmit={submit}>
        <textarea value={text} onChange={event => setText(event.target.value)} onKeyDown={event => {
          if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(text); }
        }} rows={1} placeholder="Ask Arch Assistant..." aria-label="Chat question" />
        <button type="submit" aria-label="Send question">➤</button>
      </form>
      <small className="chat-disclaimer">Virtual assistant · For estimates, request a formal quote.</small>
    </section>}
    <button className="chat-launcher" type="button" onClick={() => { setOpen(value => !value); setGreeting(false); }} aria-expanded={open} aria-label={open ? "Close chat" : "Open chat"}>
      {open ? "×" : <><span>Chat with us</span><b>⌁</b></>}
    </button>
  </div>;
}
