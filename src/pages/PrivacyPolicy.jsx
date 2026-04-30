import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'information-collected', title: '2. Information We Collect' },
  { id: 'how-we-use', title: '3. How We Use Your Information' },
  { id: 'instagram-facebook-data', title: '4. Instagram & Facebook Data' },
  { id: 'data-sharing', title: '5. Data Sharing' },
  { id: 'data-retention', title: '6. Data Retention' },
  { id: 'your-rights', title: '7. Your Rights' },
  { id: 'data-deletion', title: '8. Data Deletion' },
  { id: 'security', title: '9. Security' },
  { id: 'childrens-privacy', title: "10. Children's Privacy" },
  { id: 'changes', title: '11. Changes to This Policy' },
  { id: 'contact', title: '12. Contact Us' },
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

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('introduction');

  useEffect(() => { document.title = 'Privacy Policy — AIRA'; }, []);

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
            <Shield size={14} />Legal Document
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground mb-3">Privacy Policy</h1>
          <p className="font-body text-muted-foreground text-sm">Effective Date: April 30, 2026 · Last Updated: April 30, 2026</p>
        </div>
        <div className="flex gap-12">
          <TableOfContents activeSection={activeSection} />
          <article className="flex-1 min-w-0 space-y-10">

            <section id="introduction" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">1. Introduction</h2>
              <div className="font-body text-foreground leading-relaxed space-y-3 text-sm sm:text-base">
                <p>AIRA ("we", "us", "our") is an AI-powered creator intelligence platform operated by Aryadev Chatterjee, based in India. This Privacy Policy explains how we collect, use, and protect your information when you use the AIRA platform available at <a href="https://airra.in" className="text-primary hover:underline">airra.in</a> and our mobile applications.</p>
                <p>By using AIRA, you agree to the collection and use of information in accordance with this policy. Questions? Contact us at <a href="mailto:airrasupport@gmail.com" className="text-primary hover:underline">airrasupport@gmail.com</a>.</p>
              </div>
            </section>

            <section id="information-collected" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">2. Information We Collect</h2>
              <div className="font-body text-foreground leading-relaxed space-y-4 text-sm sm:text-base">
                <div><p className="font-semibold mb-1">a. Account Information</p><p className="text-muted-foreground">Name, email address, and profile picture (via Google Sign-In or email registration).</p></div>
                <div><p className="font-semibold mb-1">b. Creator Profile</p><p className="text-muted-foreground">Niche, platform preference (Instagram/YouTube), follower range, content goals, and archetype.</p></div>
                <div>
                  <p className="font-semibold mb-2">c. Connected Account Data (if you choose to connect)</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                    <li><span className="font-medium text-foreground">Instagram:</span> Follower count, post engagement rates, audio used in Reels, hashtag patterns, posting frequency.</li>
                    <li><span className="font-medium text-foreground">YouTube:</span> Subscriber count, video view counts, upload frequency, title patterns.</li>
                  </ul>
                </div>
                <div><p className="font-semibold mb-1">d. Content Generation Data</p><p className="text-muted-foreground">Scripts, captions, hooks, and hashtags you generate using AIRA.</p></div>
                <div><p className="font-semibold mb-1">e. Usage Data</p><p className="text-muted-foreground">Features used, session duration, and interaction patterns.</p></div>
                <div><p className="font-semibold mb-1">f. Device Information</p><p className="text-muted-foreground">Device type, operating system, app version, and push notification token.</p></div>
                <div><p className="font-semibold mb-1">g. Payment Information</p><p className="text-muted-foreground">Subscription status processed via RevenueCat. We do not store card or payment details.</p></div>
              </div>
            </section>

            <section id="how-we-use" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">3. How We Use Your Information</h2>
              <ul className="font-body text-muted-foreground text-sm sm:text-base space-y-2 list-disc list-inside leading-relaxed">
                <li>Personalise trend recommendations to your niche and platform</li>
                <li>Generate AI-powered content tailored to your archetype</li>
                <li>Analyse your account performance (with your explicit permission)</li>
                <li>Send trend alerts and posting reminders via push notifications</li>
                <li>Improve AIRA's AI models and recommendation accuracy</li>
                <li>Process subscription payments</li>
                <li>Provide customer support</li>
              </ul>
            </section>

            <section id="instagram-facebook-data" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">4. Instagram and Facebook Data</h2>
              <div className="font-body text-foreground text-sm sm:text-base space-y-4 leading-relaxed">
                <p>When you connect your Instagram Business account via OAuth:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                  <li>We request <strong className="text-foreground">read-only</strong> access to your media and insights</li>
                  <li>We access: post performance metrics, reach, impressions, and engagement rates</li>
                  <li>We do <strong className="text-foreground">NOT</strong> post on your behalf</li>
                  <li>We do <strong className="text-foreground">NOT</strong> store your Instagram password</li>
                  <li>We do <strong className="text-foreground">NOT</strong> share your Instagram data with third parties</li>
                  <li>Your Instagram access token is encrypted and stored securely</li>
                  <li>You can disconnect at any time from Settings → Connected Accounts</li>
                  <li>Upon disconnection, we delete your stored Instagram access token within 24 hours</li>
                </ul>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p>Data obtained via the Instagram Graph API is used solely to provide personalised analytics within AIRA. We comply with Meta's Platform Terms and Developer Policies.</p>
                </div>
              </div>
            </section>

            <section id="data-sharing" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">5. Data Sharing</h2>
              <div className="font-body text-foreground text-sm sm:text-base space-y-4 leading-relaxed">
                <p className="font-semibold">We do NOT sell your personal data.</p>
                <p className="text-muted-foreground">We share data only with the following trusted processors:</p>
                <div className="space-y-3">
                  {[
                    { name: 'Firebase (Google)', desc: 'Authentication and push notifications' },
                    { name: 'RevenueCat', desc: 'Subscription management' },
                    { name: 'Groq', desc: 'AI content generation (anonymised prompts only)' },
                    { name: 'Railway.app', desc: 'Cloud hosting infrastructure' },
                  ].map((p) => (
                    <div key={p.name} className="flex gap-3 p-3 bg-secondary rounded-lg">
                      <span className="font-semibold text-foreground shrink-0 w-36">{p.name}</span>
                      <span className="text-muted-foreground">{p.desc}</span>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-sm">All third-party processors are bound by data processing agreements.</p>
              </div>
            </section>

            <section id="data-retention" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">6. Data Retention</h2>
              <div className="font-body text-sm sm:text-base space-y-1">
                {[
                  { label: 'Account data', value: 'Retained while your account is active' },
                  { label: 'Content generation history', value: '12 months' },
                  { label: 'Instagram/YouTube OAuth tokens', value: 'Deleted within 24 hours of disconnection' },
                  { label: 'Analytics data', value: '6-month rolling window' },
                  { label: 'After account deletion', value: 'All personal data deleted within 30 days' },
                ].map((row) => (
                  <div key={row.label} className="flex flex-col sm:flex-row sm:justify-between border-b border-border py-2.5 gap-1">
                    <span className="font-medium text-foreground">{row.label}</span>
                    <span className="text-muted-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section id="your-rights" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">7. Your Rights</h2>
              <div className="font-body text-foreground text-sm sm:text-base space-y-3 leading-relaxed">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                  <li>Access your personal data — email <a href="mailto:airrasupport@gmail.com" className="text-primary hover:underline">airrasupport@gmail.com</a></li>
                  <li>Correct inaccurate data — via Profile settings in the app</li>
                  <li>Delete your account and all associated data — via Profile → Delete Account</li>
                  <li>Withdraw consent for Instagram/YouTube connection at any time</li>
                  <li>Request a copy of your data — email <a href="mailto:airrasupport@gmail.com" className="text-primary hover:underline">airrasupport@gmail.com</a></li>
                </ul>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-2">
                  <p>For Instagram data deletion requests, visit: <Link to="/data-deletion" className="text-primary hover:underline font-medium">airra.in/data-deletion</Link></p>
                </div>
              </div>
            </section>

            <section id="data-deletion" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">8. Data Deletion</h2>
              <div className="font-body text-foreground text-sm sm:text-base space-y-4 leading-relaxed">
                <p className="text-muted-foreground">To delete all your AIRA data, choose one of the following options:</p>
                <div className="space-y-3">
                  <div className="p-4 bg-secondary rounded-lg"><p className="font-semibold mb-1">Option 1 — In the App</p><p className="text-muted-foreground">Profile → Settings → Delete Account</p></div>
                  <div className="p-4 bg-secondary rounded-lg"><p className="font-semibold mb-1">Option 2 — Email Request</p><p className="text-muted-foreground">Email <a href="mailto:airrasupport@gmail.com" className="text-primary hover:underline">airrasupport@gmail.com</a> with subject: "Data Deletion Request"</p></div>
                  <div className="p-4 bg-secondary rounded-lg"><p className="font-semibold mb-1">Option 3 — Deletion Form</p><p className="text-muted-foreground">Use our <Link to="/data-deletion" className="text-primary hover:underline font-medium">Data Deletion Request form</Link></p></div>
                </div>
                <p className="text-muted-foreground">We will confirm deletion within <strong className="text-foreground">30 days</strong> of your request.</p>
              </div>
            </section>

            <section id="security" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">9. Security</h2>
              <ul className="font-body text-muted-foreground text-sm sm:text-base space-y-2 list-disc list-inside leading-relaxed">
                <li>AES-256 encryption for stored OAuth tokens</li>
                <li>HTTPS/TLS for all data in transit</li>
                <li>Firebase Authentication for secure login</li>
                <li>Regular security audits</li>
              </ul>
            </section>

            <section id="childrens-privacy" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">10. Children's Privacy</h2>
              <p className="font-body text-muted-foreground text-sm sm:text-base leading-relaxed">AIRA is not intended for users under 13 years of age. We do not knowingly collect personal data from children under 13. If you believe a child has provided us with personal information, contact us at <a href="mailto:airrasupport@gmail.com" className="text-primary hover:underline">airrasupport@gmail.com</a> and we will delete it promptly.</p>
            </section>

            <section id="changes" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">11. Changes to This Policy</h2>
              <p className="font-body text-muted-foreground text-sm sm:text-base leading-relaxed">We will notify you of material changes via email or in-app notification at least <strong className="text-foreground">7 days</strong> before changes take effect. Continued use of AIRA after that date constitutes acceptance of the updated policy.</p>
            </section>

            <section id="contact" className="bg-card border border-border rounded-xl p-6 scroll-mt-24">
              <h2 className="font-heading text-xl text-primary mb-4">12. Contact Us</h2>
              <div className="font-body text-foreground text-sm sm:text-base space-y-1.5 leading-relaxed">
                <p><span className="font-medium">Company:</span> <span className="text-muted-foreground">AIRA</span></p>
                <p><span className="font-medium">Founders:</span> <span className="text-muted-foreground">Aryadev Chatterjee, Sathish Dath, Shamit Sinha</span></p>
                <p><span className="font-medium">Email:</span> <a href="mailto:airrasupport@gmail.com" className="text-primary hover:underline">airrasupport@gmail.com</a></p>
                <p><span className="font-medium">Website:</span> <a href="https://airra.in" className="text-primary hover:underline">airra.in</a></p>
                <p><span className="font-medium">Location:</span> <span className="text-muted-foreground">India</span></p>
              </div>
            </section>

          </article>
        </div>
      </div>
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-muted-foreground">© 2026 AIRA. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="font-body text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/data-deletion" className="font-body text-xs text-muted-foreground hover:text-primary transition-colors">Data Deletion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
