import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, CheckCircle2, Mail, Smartphone } from 'lucide-react';

export default function DataDeletion() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { document.title = 'Data Deletion Request — AIRA'; }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent('Data Deletion Request');
    const body = encodeURIComponent(
      `Name: ${formData.name}\nRegistered Email: ${formData.email}\n\nMessage:\n${formData.message || 'Please delete all my AIRA data.'}`
    );
    window.location.href = `mailto:airrasupport@gmail.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const deletedItems = [
    'Your account and profile information',
    'All content generation history (scripts, captions, hooks)',
    'Connected Instagram and YouTube access tokens',
    'All analytics and engagement data',
    'Push notification tokens',
    'All personal preferences and archetype data',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-destructive/10 rounded-2xl mb-5">
            <Trash2 size={24} className="text-destructive" />
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl text-foreground mb-3">Data Deletion Request</h1>
          <p className="font-body text-muted-foreground text-base leading-relaxed max-w-lg mx-auto">
            We respect your right to privacy. Use any of the options below to request deletion of all your AIRA data.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-5 mb-10">
          {/* Option 1 */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Smartphone size={18} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-heading text-lg text-foreground">Option 1</h2>
                  <span className="bg-primary/10 text-primary font-body text-xs font-medium px-2.5 py-0.5 rounded-full">Fastest</span>
                </div>
                <p className="font-body font-semibold text-foreground text-sm mb-1">Delete directly in the app</p>
                <p className="font-body text-muted-foreground text-sm">Open AIRA → Profile → Settings → <strong className="text-foreground">Delete Account</strong></p>
                <p className="font-body text-muted-foreground text-xs mt-2">All data deleted within 30 days.</p>
              </div>
            </div>
          </div>

          {/* Option 2 */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Mail size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-lg text-foreground mb-1">Option 2 — Email Request</h2>
                <p className="font-body text-muted-foreground text-sm">
                  Send an email to{' '}
                  <a href="mailto:airrasupport@gmail.com?subject=Data%20Deletion%20Request" className="text-primary hover:underline font-medium">
                    airrasupport@gmail.com
                  </a>
                </p>
                <div className="mt-3 p-3 bg-secondary rounded-lg font-body text-sm space-y-1">
                  <p><span className="text-muted-foreground">Subject:</span> <span className="text-foreground font-medium">"Data Deletion Request"</span></p>
                  <p><span className="text-muted-foreground">Body:</span> <span className="text-foreground">Your registered email address</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form - Option 3 */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 mb-10">
          <h2 className="font-heading text-xl text-foreground mb-1">Option 3 — Use this form</h2>
          <p className="font-body text-muted-foreground text-sm mb-6">Fill in your details below and we'll open your email client with a pre-filled deletion request.</p>

          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
              <h3 className="font-heading text-xl text-foreground mb-2">Email client opened!</h3>
              <p className="font-body text-muted-foreground text-sm max-w-sm mx-auto">Your deletion request email has been pre-filled. Please send it to complete your request. We'll confirm deletion within 30 days.</p>
              <button onClick={() => setSubmitted(false)} className="mt-6 font-body text-sm text-primary hover:underline">Submit another request</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="deletion-name" className="block font-body font-medium text-foreground text-sm mb-1.5">Full Name</label>
                <input
                  id="deletion-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="deletion-email" className="block font-body font-medium text-foreground text-sm mb-1.5">Registered Email Address</label>
                <input
                  id="deletion-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <p className="font-body text-xs text-muted-foreground mt-1.5">Use the email address associated with your AIRA account</p>
              </div>
              <div>
                <label htmlFor="deletion-message" className="block font-body font-medium text-foreground text-sm mb-1.5">Additional Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
                <textarea
                  id="deletion-message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Any specific data you want deleted, or additional context..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Send Deletion Request
              </button>
              <p className="font-body text-xs text-muted-foreground text-center">This will open your email client with the request pre-filled.</p>
            </form>
          )}
        </div>

        {/* What gets deleted */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading text-lg text-foreground mb-4">What gets deleted</h2>
          <ul className="space-y-3">
            {deletedItems.map((item) => (
              <li key={item} className="flex items-start gap-3 font-body text-sm text-muted-foreground">
                <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-5 border-t border-border">
            <p className="font-body text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Timeline:</span> We confirm deletion within <strong className="text-foreground">30 days</strong> of receiving your request.
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="font-body text-xs text-muted-foreground text-center mt-8">
          Questions? Email us at{' '}
          <a href="mailto:airrasupport@gmail.com" className="text-primary hover:underline">airrasupport@gmail.com</a>
          {' '}·{' '}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
