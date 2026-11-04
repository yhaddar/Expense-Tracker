import Link from 'next/link';

const features = [
  {
    icon: '↕',
    title: 'One clear ledger',
    text: 'Income, spending, refunds, and transfers stay easy to understand across the household.',
  },
  {
    icon: '◒',
    title: 'Plans that feel useful',
    text: 'Set calm, visible limits for a month or a category before surprises become stress.',
  },
  {
    icon: '⌁',
    title: 'Private by design',
    text: 'Server-side permissions, audit trails, private attachments, and explicit wallet membership.',
  },
];

export default function WelcomePage() {
  return (
    <main className="marketing-page">
      <nav className="marketing-nav" aria-label="Marketing navigation">
        <Link className="brand marketing-brand" href="/welcome">
          <span className="brand-mark" aria-hidden="true">
            ◎
          </span>
          <span>Atlas Ledger</span>
        </Link>
        <div>
          <Link href="#features">How it helps</Link>
          <Link href="#security">Security</Link>
          <Link className="button button-secondary" href="/login">
            Sign in
          </Link>
        </div>
      </nav>
      <section className="marketing-hero">
        <div className="hero-copy">
          <p className="eyebrow">A calmer household ledger</p>
          <h1>
            Make shared money feel <em>clear.</em>
          </h1>
          <p>
            Atlas Ledger brings the whole household into the same trustworthy
            view of what came in, what went out, and what is planned next.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/register">
              Create your wallet
            </Link>
            <Link className="text-button" href="/login">
              Already have an account →
            </Link>
          </div>
          <div className="trust-line">
            <span>●</span> Exact MAD balances · Explicit access · Auditable
            history
          </div>
        </div>
        <div className="marketing-preview" aria-label="Product preview">
          <div className="preview-top">
            <span>Shared Wallet</span>
            <span className="preview-dot">● Online</span>
          </div>
          <p className="eyebrow">Available balance</p>
          <strong>12,480.50 MAD</strong>
          <div className="preview-bars">
            <span style={{ height: '44%' }} />
            <span style={{ height: '66%' }} />
            <span style={{ height: '52%' }} />
            <span style={{ height: '78%' }} />
            <span style={{ height: '60%' }} />
            <span style={{ height: '88%' }} />
            <span style={{ height: '72%' }} />
          </div>
          <div className="preview-footer">
            <span>Household essentials</span>
            <strong>74%</strong>
          </div>
          <div className="preview-progress">
            <span />
          </div>
        </div>
      </section>
      <section className="marketing-section" id="features">
        <div className="section-intro">
          <p className="eyebrow">Designed for real households</p>
          <h2>Enough structure to help. Enough warmth to live with.</h2>
        </div>
        <div className="marketing-features">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <span className="feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="marketing-security" id="security">
        <div>
          <p className="eyebrow">Trust is a feature</p>
          <h2>Your financial history stays yours.</h2>
          <p>
            Atlas Ledger is being built around clear authorization, exact money
            arithmetic, private attachment storage, and an audit trail for
            sensitive changes. The product will show what is known, what is
            pending, and what still needs your attention.
          </p>
        </div>
        <ul>
          <li>
            <strong>Server-checked access</strong>
            <span>Wallet membership and roles are enforced by the API.</span>
          </li>
          <li>
            <strong>Private files</strong>
            <span>
              Attachments are scanned before clean files become available.
            </span>
          </li>
          <li>
            <strong>Honest numbers</strong>
            <span>Transfers stay separate from income and expenses.</span>
          </li>
        </ul>
      </section>
      <section className="marketing-cta">
        <p className="eyebrow">Start with clarity</p>
        <h2>Bring your household ledger into focus.</h2>
        <Link className="button button-light" href="/register">
          Create your account
        </Link>
      </section>
      <footer className="marketing-footer">
        <span>© 2026 Atlas Ledger</span>
        <span>Shared household finance, thoughtfully made.</span>
        <Link href="/login">Sign in</Link>
      </footer>
    </main>
  );
}
