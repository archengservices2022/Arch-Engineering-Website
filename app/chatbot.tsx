"use client";

import { FormEvent, useState } from "react";

type Message = { from: "bot" | "user"; text: string };

const answers = [
  { words: ["mechanical", "cad", "drawing", "solidworks", "inventor"], reply: "We provide 3D modeling, 2D drawings, sheet metal design, reverse engineering, GD&T, Inventor iLogic, and CAD automation." },
  { words: ["software", "web", "mobile", "desktop", "app"], reply: "We build custom web, mobile, and desktop applications, APIs, cloud solutions, and business automation." },
  { words: ["ilogic", "automation", "dxf", "dwg", "pdf"], reply: "Our Inventor iLogic automation can generate PDF, DXF, and DWG deliverables automatically and reduce repetitive engineering time." },
  { words: ["price", "cost", "rate", "budget"], reply: "Pricing depends on project scope. Mechanical work is commonly estimated by project hours. Send your requirements for a clear quote." },
  { words: ["contact", "phone", "email", "location"], reply: "Call +1 (314) 706-3946, email archengservices2022@gmail.com, or visit our Contact page. We are in St. Louis, Missouri." }
];

function getReply(value: string) {
  const input = value.toLowerCase();
  const match = answers.find(answer => answer.words.some(word => input.includes(word)));
  return match?.reply ?? "Tell me whether you need mechanical engineering, CAD automation, or custom software. For a project estimate, use Request a Quote.";
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: "Hello! I’m the Arch Assistant. How can we help with your engineering or software project?" }
  ]);

  function ask(value: string) {
    const clean = value.trim();
    if (!clean) return;
    setMessages(current => [...current, { from: "user", text: clean }, { from: "bot", text: getReply(clean) }]);
    setText("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask(text);
  }

  return <div className="arch-chat">
    {open && <section className="chat-panel" aria-label="Arch Engineering chat assistant">
      <header className="chat-head">
        <span className="chat-mark">A</span>
        <span><b>Arch Assistant</b><small>Engineering & software help</small></span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
      </header>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => <p key={index} className={message.from}>{message.text}</p>)}
      </div>
      <div className="chat-options">
        {["Mechanical services", "Software services", "iLogic automation", "Contact details"].map(option =>
          <button type="button" key={option} onClick={() => ask(option)}>{option}</button>
        )}
      </div>
      <form className="chat-input" onSubmit={submit}>
        <input value={text} onChange={event => setText(event.target.value)} placeholder="Type your question..." aria-label="Chat question" />
        <button type="submit" aria-label="Send question">→</button>
      </form>
      <a className="chat-quote" href="/contact">Request a project quote</a>
    </section>}
    <button className="chat-launcher" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? "Close chat" : "Open chat"}>
      {open ? "×" : <><span>Chat with us</span><b>⌁</b></>}
    </button>
  </div>;
}
