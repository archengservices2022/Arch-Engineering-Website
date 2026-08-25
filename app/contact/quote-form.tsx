"use client";
import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

export default function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setStatus("sending");
    setMessage("");

    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json() as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "We could not send your enquiry.");
      }

      formElement.reset();
      setStatus("success");
      setMessage("Thank you. Your project enquiry was sent successfully. Arch Engineering will contact you soon.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We could not send your enquiry. Please try again.");
    }
  }

  return <form className="quote-form" onSubmit={submit}>
    <input className="form-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <div className="form-row">
      <label>Full name *<input name="name" required autoComplete="name" /></label>
      <label>Email *<input name="email" type="email" required autoComplete="email" /></label>
    </div>
    <div className="form-row">
      <label>Phone<input name="phone" type="tel" autoComplete="tel" /></label>
      <label>Company<input name="company" autoComplete="organization" /></label>
    </div>
    <label>Service needed *
      <select name="service" required defaultValue="">
        <option value="" disabled>Select a service</option>
        <option>Mechanical CAD & drawings</option>
        <option>Inventor iLogic / CAD automation</option>
        <option>Custom software development</option>
        <option>Web or mobile application</option>
        <option>Not sure yet</option>
      </select>
    </label>
    <div className="form-row">
      <label>Desired timeline<select name="timeline"><option>Flexible</option><option>Within 1 month</option><option>1–3 months</option><option>3+ months</option></select></label>
      <label>Approximate budget<select name="budget"><option>Not decided</option><option>Under $5,000</option><option>$5,000–$15,000</option><option>$15,000+</option></select></label>
    </div>
    <label>Project details *<textarea name="details" rows={7} required maxLength={5000} placeholder="Describe the current problem, available files or systems, and the result you need." /></label>
    <button className="button primary" type="submit" disabled={status === "sending"}>
      {status === "sending" ? "Sending enquiry…" : "Send quote request →"}
    </button>
    <small>Your enquiry is submitted securely and a notification is sent directly to Arch Engineering.</small>
    {message && <p className={status === "success" ? "form-note form-success" : "form-note form-error"} role="status">{message}</p>}
  </form>;
}
