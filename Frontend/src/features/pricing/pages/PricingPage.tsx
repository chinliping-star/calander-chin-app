import { useState } from 'react';
import { Check, Zap, Star, Crown, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell.tsx';

type Billing = 'monthly' | 'yearly';

interface Plan {
  key: string;
  name: string;
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
  price: { monthly: number; yearly: number };
  badge?: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

const PLANS: Plan[] = [
  {
    key: 'free',
    name: 'Free',
    icon: Zap,
    price: { monthly: 0, yearly: 0 },
    color: 'var(--text)',
    bg: 'var(--bg)',
    border: 'var(--border)',
    description: 'Perfect for getting started with social planning.',
    features: [
      'Personal calendar',
      'Unlimited friends',
      'Propose meetups',
      'Basic day states',
      'Public profile page',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    icon: Star,
    price: { monthly: 7, yearly: 5 },
    badge: 'Most Popular',
    color: 'var(--color-primary)',
    bg: 'var(--color-tertiary)',
    border: 'var(--color-primary-light)',
    description: 'For active social butterflies who plan often.',
    features: [
      'Everything in Free',
      'Custom themes & colors',
      'Sticker packs (V3)',
      'Weekly digest emails',
      'Priority support',
    ],
    cta: 'Coming Soon',
    highlighted: true,
  },
  {
    key: 'premium',
    name: 'Premium',
    icon: Crown,
    price: { monthly: 14, yearly: 10 },
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#c084fc',
    description: 'Unlock the full Friendiary experience.',
    features: [
      'Everything in Pro',
      'Memory photo uploads',
      'Memory album on profile',
      'Advanced analytics',
      'Early access to new features',
      'Dedicated support',
    ],
    cta: 'Coming Soon',
    highlighted: false,
  },
];

const FAQS = [
  { q: 'How much does it cost right now?', a: 'Nothing. Every feature is free for our first 1000 users during early access — no card required.' },
  { q: 'What happens after the first 1000 users?', a: 'Paid plans will roll out later. Early users keep their access while we finalize pricing.' },
  { q: 'Do I need to pay for Pro or Premium features?', a: 'No. During development all Pro and Premium features are unlocked for everyone.' },
  { q: 'Will my data be safe?', a: 'Yes — your calendar, friends and memories stay safe regardless of plan.' },
];

// ── Pricing Page ──────────────────────────────────────────────────────────────

export function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto pb-20">

        {/* Hero */}
        <div className="flex flex-col items-center text-center py-10">
          <span
            className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}
          >
            Early Access
          </span>
          <h1
            className="font-bold tracking-tight mb-3"
            style={{ fontSize: '40px', color: 'var(--text-h)', margin: '0 0 12px' }}
          >
            Free for our first 1000 users
          </h1>
          <p className="text-base max-w-md mx-auto" style={{ color: 'var(--text)' }}>
            We're in early access — every feature is unlocked for everyone, no payment needed.
          </p>
        </div>

        {/* Early-access banner */}
        <div
          className="rounded-2xl p-5 mb-10 flex items-center justify-center gap-3 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #c084fc 100%)',
            boxShadow: '0 8px 32px var(--accent-border)',
          }}
        >
          <Gift size={22} color="#ffffff" className="shrink-0" />
          <p className="text-sm font-semibold text-white">
            🎉 All Pro &amp; Premium features are <strong>100% free</strong> for the first 1000 users.
            No subscription required during early access.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div
            className="flex items-center gap-0.5 p-1 rounded-full"
            style={{ backgroundColor: 'var(--color-tertiary)', border: '1px solid var(--border)' }}
            role="group"
            aria-label="Billing cycle"
          >
            {(['monthly', 'yearly'] as Billing[]).map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all focus-visible:outline-none"
                style={billing === b
                  ? { backgroundColor: 'var(--color-primary)', color: '#ffffff', boxShadow: '0 2px 8px var(--accent-border)' }
                  : { color: 'var(--text)' }}
              >
                {b === 'monthly' ? 'Monthly' : 'Yearly'}
                {b === 'yearly' && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: billing === 'yearly' ? 'rgba(255,255,255,0.25)' : 'var(--color-primary)', color: '#fff' }}
                  >
                    Save 30%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map(plan => {
            const price = plan.price[billing];
            const Icon = plan.icon;
            const isPaidPlan = plan.key !== 'free';
            return (
              <div
                key={plan.key}
                className="relative flex flex-col rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
                style={{
                  backgroundColor: plan.bg,
                  border: plan.highlighted ? `2px solid ${plan.border}` : `1px solid ${plan.border}`,
                  boxShadow: plan.highlighted
                    ? '0 12px 40px var(--accent-border)'
                    : '0 2px 12px rgba(74,62,78,0.08)',
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white whitespace-nowrap"
                      style={{ backgroundColor: plan.color }}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Icon + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${plan.color}18` }}
                  >
                    <Icon size={20} style={{ color: plan.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-base" style={{ color: 'var(--text-h)' }}>{plan.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text)' }}>{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold" style={{ color: plan.color }}>
                      ${price}
                    </span>
                    {price > 0 && (
                      <span className="text-sm mb-1.5" style={{ color: 'var(--text)' }}>
                        / mo{billing === 'yearly' ? ' · billed yearly' : ''}
                      </span>
                    )}
                    {price === 0 && (
                      <span className="text-sm mb-1.5" style={{ color: 'var(--text)' }}>/ forever</span>
                    )}
                  </div>
                  {billing === 'yearly' && price > 0 && (
                    <p className="text-xs mt-1" style={{ color: plan.color }}>
                      Save ${(plan.price.monthly - price) * 12}/yr
                    </p>
                  )}
                </div>

                {/* Early-access note on paid plans */}
                {isPaidPlan && (
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2 mb-5 text-xs font-semibold"
                    style={{ backgroundColor: `${plan.color}14`, color: plan.color }}
                  >
                    <Gift size={14} className="shrink-0" />
                    Free for the first 1000 users
                  </div>
                )}

                {/* Features */}
                <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-h)' }}>
                      <Check size={15} className="mt-0.5 shrink-0" style={{ color: plan.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isPaidPlan ? (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    title="Free for all users during early access"
                    className="w-full py-3 rounded-full text-sm font-bold cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--color-neutral)',
                      border: `1.5px solid ${plan.border}`,
                      color: 'var(--text)',
                      opacity: 0.7,
                    }}
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    to="/register"
                    className="w-full py-3 rounded-full text-sm font-bold text-center transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none"
                    style={{ backgroundColor: 'transparent', border: `1.5px solid ${plan.border}`, color: plan.color, textDecoration: 'none' }}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature comparison strip */}
        <div
          className="rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #c084fc 100%)', boxShadow: '0 8px 32px var(--accent-border)' }}
        >
          <div>
            <p className="text-white font-bold text-base">Everything's unlocked right now</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Join early and enjoy every feature free — no credit card required.
            </p>
          </div>
          <Link
            to="/register"
            className="px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none shrink-0"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--color-primary)', textDecoration: 'none' }}
          >
            Start for Free →
          </Link>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-center font-bold mb-6"
            style={{ fontSize: '22px', color: 'var(--text-h)', margin: '0 0 24px' }}
          >
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-2">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--border)' }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:opacity-80 transition-opacity focus-visible:outline-none"
                  style={{ backgroundColor: openFaq === i ? 'var(--color-tertiary)' : 'var(--bg)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>{faq.q}</span>
                  <span
                    className="text-lg font-light shrink-0 transition-transform"
                    style={{ color: 'var(--color-primary)', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div
                    className="px-5 pb-4 pt-1"
                    style={{ backgroundColor: 'var(--color-tertiary)', borderTop: '1px solid var(--border)' }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
