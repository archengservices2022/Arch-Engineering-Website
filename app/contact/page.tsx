import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../service-components";
import QuoteForm from "./quote-form";

export const metadata: Metadata = {
  title: "Request a Quote | Arch Engineering Services",
  description: "Discuss a mechanical CAD, iLogic automation, or custom software project with Arch Engineering Services in St. Louis."
};

export default function Contact() {
  return <main>
    <SiteHeader />
    <section className="contact-page">
      <div className="contact-sidebar">
        <p className="section-label pale">START A PROJECT</p>
        <h1>Tell us what needs to move forward.</h1>
        <p>Share the project, current bottleneck, available files, and desired result. We’ll use that information to prepare the next conversation.</p>
        <a href="tel:+13147063946"><small>PHONE</small><b>+1 (314) 706-3946</b></a>
        <a href="mailto:archengservices2022@gmail.com"><small>EMAIL</small><b>archengservices2022@gmail.com</b></a>
        <address>315 Lemay Ferry Road<br />St. Louis, MO, USA 63125</address>
      </div>
      <div className="form-panel">
        <p className="section-label">PROJECT ENQUIRY</p>
        <h2>Request a quote.</h2>
        <QuoteForm />
      </div>
    </section>
    <SiteFooter />
  </main>;
}
