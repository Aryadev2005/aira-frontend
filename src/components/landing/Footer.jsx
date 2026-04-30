import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-accent text-accent-foreground py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12">
          <div>
            <h3 className="font-heading text-2xl text-primary mb-3">AIRA</h3>
            <p className="text-accent-foreground/50 font-body text-sm leading-relaxed">
              Know what to post.<br />Before anyone else.
            </p>
          </div>
          <div>
            <h4 className="font-body font-semibold text-sm text-accent-foreground/70 mb-4 tracking-wider uppercase">
              Product
            </h4>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Blog', 'About'].map((link) => (
                <li key={link}>
                  <Link to="/" className="text-accent-foreground/50 hover:text-primary font-body text-sm transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-body font-semibold text-sm text-accent-foreground/70 mb-4 tracking-wider uppercase">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-accent-foreground/50 hover:text-primary font-body text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-accent-foreground/50 hover:text-primary font-body text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/data-deletion" className="text-accent-foreground/50 hover:text-primary font-body text-sm transition-colors">
                  Data Deletion
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-body font-semibold text-sm text-accent-foreground/70 mb-4 tracking-wider uppercase">
              Connect
            </h4>
            <ul className="space-y-2">
              {['Instagram', 'Twitter / X', 'YouTube'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-accent-foreground/50 hover:text-primary font-body text-sm transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-accent-foreground/30 font-body text-xs">
            © 2026 AIRA. All rights reserved.
          </p>
          <p className="text-accent-foreground/30 font-body text-xs mt-2 sm:mt-0">
            Made with ❤️ in India
          </p>
        </div>
      </div>
    </footer>
  );
}