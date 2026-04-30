import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'description', title: '2. Description of Service' },
  { id: 'eligibility', title: '3. Eligibility' },
  { id: 'accounts', title: '4. User Accounts' },
  { id: 'acceptable-use', title: '5. Acceptable Use' },
  { id: 'ai-content', title: '6. AI-Generated Content' },
  { id: 'connected-accounts', title: '7. Connected Accounts' },
  { id: 'payments', title: '8. Subscription & Payments' },
  { id: 'ip', title: '9. Intellectual Property' },
  { id: 'disclaimers', title: '10. Disclaimers' },
  { id: 'liability', title: '11. Limitation of Liability' },
  { id: 'termination', title: '12. Termination' },
  { id: 'governing-law', title: '13. Governing Law' },
  { id: 'changes', title: '14. Changes to Terms' },
  { id: 'contact', title: '15. Contact' },
];

function PolicyNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-heading text-2xl text-primary">AIRA</Link>
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary font-body text-sm transition-colors">
            <ArrowLeft size={16} />Back to Home
          </Link>
        </div>
      </div>
    </nav>
  );
}

function TableOfContents({ activeSection }) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 bg-card border border-border rounded-xl p-5">
        <p className="font-body font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-4">Contents</p>
        <nav className="space-y-1">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}
              className={`block font-body text-sm py-1.5 px-2 rounded-lg transition-colors leading-snug ${
                activeSection === s.id ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}>
              {s.title}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState('acceptance');

  useEffect(() => { document.title = 'Terms of Service — AIRA'; }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { rootMargin: '-20% 0px -70% 0px' }
    );
    sections.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PolicyNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="mb-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-body text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <FileText size={14} />Legal Document
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground mb-3">Terms of Service</h1>
          <p className="font-body text-muted-foreground text-sm">Effective Date: April 30, 2026 · Last Updated: April 30, 2026</p>
        </div>
        <div className="flex gap-12">
          <TableOfContents activeSection={activeSection} />
          <article className="flex-1 min-w-0 space-y-10">

            <section id="acceptance" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">1. Acceptance of Terms</h2>
              <p className="font-body text-muted-foreground text-sm sm:text-base leading-relaxed">By using AIRA, you agree to these Terms of Service. If you do not agree, do not use AIRA. These Terms constitute a legally binding agreement between you and AIRA.</p>
            </section>

            <section id="description" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">2. Description of Service</h2>
              <p className="font-body text-muted-foreground text-sm sm:text-base leading-relaxed">AIRA provides AI-powered content intelligence tools for Indian social media creators. Features include trend analysis, content generation, song recommendations, and account analytics — all designed to help creators grow on Instagram and YouTube.</p>
            </section>

            <section id="eligibility" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">3. Eligibility</h2>
              <p className="font-body text-muted-foreground text-sm sm:text-base leading-relaxed">You must be at least <strong className="text-foreground">13 years old</strong> to use AIRA. By using AIRA, you represent and warrant that you meet this requirement.</p>
            </section>

            <section id="accounts" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">4. User Accounts</h2>
              <ul className="font-body text-muted-foreground text-sm sm:text-base space-y-2 list-disc list-inside leading-relaxed">
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must provide accurate information during registration</li>
                <li>You must not share your account credentials with others</li>
                <li>You must notify us immediately of any unauthorized account access</li>
              </ul>
            </section>

            <section id="acceptable-use" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">5. Acceptable Use</h2>
              <div className="font-body text-foreground text-sm sm:text-base space-y-3 leading-relaxed">
                <p className="text-muted-foreground">You agree NOT to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                  <li>Use AIRA to create spam or misleading content</li>
                  <li>Attempt to reverse engineer or scrape AIRA's AI systems</li>
                  <li>Use AIRA in violation of Instagram's, YouTube's, or any platform's terms</li>
                  <li>Share, resell, or sublicense AIRA's AI-generated content commercially without attribution</li>
                  <li>Use AIRA to generate content that is harmful, hateful, or illegal</li>
                </ul>
              </div>
            </section>

            <section id="ai-content" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">6. AI-Generated Content</h2>
              <ul className="font-body text-muted-foreground text-sm sm:text-base space-y-2 list-disc list-inside leading-relaxed">
                <li>AIRA uses AI to generate content suggestions, scripts, and captions</li>
                <li>You are responsible for reviewing and editing AI-generated content before publishing</li>
                <li>AIRA does not guarantee the accuracy, originality, or performance of AI-generated content</li>
                <li>You retain ownership of content you create using AIRA's tools</li>
              </ul>
            </section>

            <section id="connected-accounts" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">7. Connected Accounts (Instagram/YouTube)</h2>
              <ul className="font-body text-muted-foreground text-sm sm:text-base space-y-2 list-disc list-inside leading-relaxed">
                <li>Connecting your social accounts is optional</li>
                <li>You grant AIRA read-only access to your account analytics</li>
                <li>AIRA will never post on your behalf without your explicit action</li>
                <li>You can disconnect accounts at any time from Settings</li>
                <li>We comply with Meta Platform Terms and YouTube API Services Terms of Service</li>
              </ul>
            </section>

            <section id="payments" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">8. Subscription and Payments</h2>
              <div className="font-body text-foreground text-sm sm:text-base space-y-3 leading-relaxed">
                <div className="space-y-3">
                  <div className="p-4 bg-secondary rounded-lg"><p className="font-semibold text-foreground mb-1">Free Plan</p><p className="text-muted-foreground">Limited features, no payment required</p></div>
                  <div className="p-4 bg-secondary rounded-lg"><p className="font-semibold text-foreground mb-1">Pro Plan</p><p className="text-muted-foreground">₹499/month or ₹5,000/year, billed via RevenueCat</p></div>
                </div>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                  <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
                  <li>Refunds: contact <a href="mailto:airrasupport@gmail.com" className="text-primary hover:underline">airrasupport@gmail.com</a> within 7 days of charge</li>
                  <li>We reserve the right to change pricing with 30 days notice</li>
                </ul>
              </div>
            </section>

            <section id="ip" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">9. Intellectual Property</h2>
              <ul className="font-body text-muted-foreground text-sm sm:text-base space-y-2 list-disc list-inside leading-relaxed">
                <li>AIRA's platform, design, and underlying technology are owned by Aryadev Chatterjee</li>
                <li>You may not copy, reproduce, or distribute AIRA's interface or systems</li>
                <li>Trend data and analytics are proprietary to AIRA</li>
              </ul>
            </section>

            <section id="disclaimers" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">10. Disclaimers</h2>
              <ul className="font-body text-muted-foreground text-sm sm:text-base space-y-2 list-disc list-inside leading-relaxed">
                <li>AIRA is provided "as is" without warranties of any kind</li>
                <li>We do not guarantee specific follower growth or engagement results</li>
                <li>Trend predictions are AI-generated estimates, not guarantees</li>
                <li>We are not responsible for actions taken by social media platforms on your account</li>
              </ul>
            </section>

            <section id="liability" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">11. Limitation of Liability</h2>
              <p className="font-body text-muted-foreground text-sm sm:text-base leading-relaxed">AIRA's liability is limited to the amount you paid in the 3 months preceding any claim. We are not liable for indirect, incidental, or consequential damages arising from your use of AIRA.</p>
            </section>

            <section id="termination" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">12. Termination</h2>
              <p className="font-body text-muted-foreground text-sm sm:text-base leading-relaxed">We may suspend or terminate your account if you violate these Terms. You may cancel your account at any time via Profile → Delete Account. Upon termination, your access to AIRA will cease immediately.</p>
            </section>

            <section id="governing-law" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">13. Governing Law</h2>
              <p className="font-body text-muted-foreground text-sm sm:text-base leading-relaxed">These Terms are governed by the laws of <strong className="text-foreground">India</strong>. Disputes will be resolved in courts located in India.</p>
            </section>

            <section id="changes" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">14. Changes to Terms</h2>
              <p className="font-body text-muted-foreground text-sm sm:text-base leading-relaxed">We will notify you of material changes at least <strong className="text-foreground">7 days</strong> in advance via email or in-app notification. Continued use after that date constitutes acceptance of the updated Terms.</p>
            </section>

            <section id="contact" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">15. Contact</h2>
              <div className="font-body text-foreground text-sm sm:text-base space-y-1.5 leading-relaxed">
                <p><span className="font-medium">Company:</span> <span className="text-muted-foreground">AIRA</span></p>
                <p><span className="font-medium">Email:</span> <a href="mailto:airrasupport@gmail.com" className="text-primary hover:underline">airrasupport@gmail.com</a></p>
                <p><span className="font-medium">Website:</span> <a href="https://airra.in" className="text-primary hover:underline">airra.in</a></p>
              </div>
            </section>

          </article>
        </div>
      </div>
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-muted-foreground">© 2026 AIRA. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="font-body text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/data-deletion" className="font-body text-xs text-muted-foreground hover:text-primary transition-colors">Data Deletion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
