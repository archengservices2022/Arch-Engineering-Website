"use client";
import { useState } from "react";

export default function QuoteForm() {
  const [sent, setSent] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Project enquiry: ${form.get("service")}`);
    const body = encodeURIComponent(
      `Name: ${form.get("name")}\nEmail: ${form.get("email")}\nPhone: ${form.get("phone")}\nCompany: ${form.get("company")}\nService: ${form.get("service")}\nTimeline: ${form.get("timeline")}\nBudget: ${form.get("budget")}\n\nProject details:\n${form.get("details")}`
    );
    setSent(true);
    window.location.href = `mailto:archengservices2022@gmail.com?subject=${subject}&body=${body}`;
  }

  return <form className="quote-form" onSubmit={submit}>
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
    <label>Project details *<textarea name="details" rows={7} required placeholder="Describe the current problem, available files or systems, and the result you need." /></label>
    <button className="button primary" type="submit">Prepare email enquiry →</button>
    <small>Your email app will open with the quote details addressed to archengservices2022@gmail.com. Review it, then press Send.</small>
    {sent && <p className="form-note">Your email application should now be open. If it did not open, email archengservices2022@gmail.com directly.</p>}
  </form>;
}
