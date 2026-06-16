import { useState } from 'react';
import { Check, Zap, Star, Crown, X, CreditCard, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AppShell } from '../../../components/layout/AppShell.tsx';
import { useApi } from '../../../lib/api.ts';
import { useAuthStore } from '../../../store/auth.ts';

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
      'Up to 5 friends',
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
      'Unlimited friends',
      'Custom themes & colors',
      'Sticker packs (V3)',
      'Weekly digest emails',
      'Priority support',
    ],
    cta: 'Start Pro',
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
    cta: 'Go Premium',
    highlighted: false,
  },
];

const FAQS = [
  { q: 'Can I cancel anytime?',          a: 'Yes — cancel anytime from Settings → Account. No hidden fees.' },
  { q: 'What happens to my data if I downgrade?', a: 'Your data stays safe. Premium features are hidden but not deleted.' },
  { q: 'Is there a student discount?',   a: 'Yes — email us with your .edu address for 50% off Pro.' },
  { q: 'Do you offer team plans?',       a: 'Group plans are coming in V6. Join the waitlist!' },
];

// ── Dummy Checkout Modal ──────────────────────────────────────────────────────

function CheckoutModal({ planName, price, onClose }: { planName: string; price: number; onClose: () => void }) {
  const api = useApi();
  const { updateUser } = useAuthStore();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [form, setForm] = useState({ firstName: '', lastName: '', address: '', card: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: () => api.patch<{ is_premium: boolean }>('/users/me', { is_premium: true }),
    onSuccess: () => {
      updateUser({ is_premium: true });
      setStep('success');
    },
  });

  function formatCard(val: string) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(val: string) {
    const d = val.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    if (form.card.replace(/\s/g, '').length < 16) e.card = 'Enter valid 16-digit card number';
    if (form.expiry.length < 5) e.expiry = 'Enter MM/YY';
    if (form.cvv.length < 3) e.cvv = 'Enter 3-digit CVV';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) subscribe();
  }

  const field = (key: keyof typeof form, label: string, placeholder: string, extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>) => (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-h)' }}>{label}</label>
      <input
        {...extra}
        value={form[key]}
        onChange={e => {
          let v = e.target.value;
          if (key === 'card') v = formatCard(v);
          if (key === 'expiry') v = formatExpiry(v);
          if (key === 'cvv') v = v.replace(/\D/g, '').slice(0, 4);
          setForm(f => ({ ...f, [key]: v }));
          if (errors[key]) setErrors(er => ({ ...er, [key]: undefined }));
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
        style={{ backgroundColor: 'var(--color-neutral)', border: `1px solid ${errors[key] ? '#e11d48' : 'var(--border)'}`, color: 'var(--text-h)' }}
      />
      {errors[key] && <p className="text-xs mt-1" style={{ color: '#e11d48' }}>{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>

        {step === 'success' ? (
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-tertiary)' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--color-primary)' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>You're Premium!</h2>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Welcome to {planName}. All premium features are now unlocked.
            </p>
            <button type="button" onClick={onClose} className="mt-2 px-8 py-2.5 rounded-full text-sm font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
              Start Exploring
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--text-h)' }}>Subscribe to {planName}</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>${price}/mo · Cancel anytime</p>
              </div>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:opacity-70" style={{ color: 'var(--text)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {field('firstName', 'First Name', 'John')}
                {field('lastName', 'Last Name', 'Doe')}
              </div>
              {field('address', 'Billing Address', '123 Main St, City')}

              <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={15} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text)' }}>Payment Details</span>
                </div>
                {field('card', 'Card Number', '1234 5678 9012 3456')}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {field('expiry', 'Expiry', 'MM/YY')}
                  {field('cvv', 'CVV', '123')}
                </div>
              </div>

              <p className="text-[11px] text-center" style={{ color: 'var(--text)' }}>
                🔒 Demo only — no real payment processed
              </p>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {isPending ? 'Processing…' : `Subscribe · $${price}/mo`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Pricing Page ──────────────────────────────────────────────────────────────

export function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);

  return (
    <AppShell>
      {checkoutPlan && (
        <CheckoutModal
          planName={checkoutPlan.name}
          price={checkoutPlan.price[billing]}
          onClose={() => setCheckoutPlan(null)}
        />
      )}
      <div className="max-w-5xl mx-auto pb-20">

        {/* Hero */}
        <div className="text-center py-10">
          <span
            className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}
          >
            Simple Pricing
          </span>
          <h1
            className="font-bold tracking-tight mb-3"
            style={{ fontSize: '40px', color: 'var(--text-h)', margin: '0 0 12px' }}
          >
            Plans for every social life
          </h1>
          <p className="text-base max-w-md mx-auto" style={{ color: 'var(--text)' }}>
            Start free. Upgrade when you're ready for more memories.
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
                    style={{ backgroundColor: billing === 'yearly' ? 'rgba(255,255,255,0.25)' : 'var(--color-primary)', color: billing === 'yearly' ? '#fff' : '#fff' }}
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
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = plan.highlighted ? '0 20px 48px var(--accent-border)' : '0 12px 32px rgba(74,62,78,0.14)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = plan.highlighted ? '0 12px 40px var(--accent-border)' : '0 2px 12px rgba(74,62,78,0.08)'; }}
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
                <div className="mb-6">
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
                <button
                  type="button"
                  onClick={() => plan.key !== 'free' && setCheckoutPlan(plan)}
                  className="w-full py-3 rounded-full text-sm font-bold transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none"
                  style={plan.highlighted
                    ? { backgroundColor: plan.color, color: '#ffffff', boxShadow: `0 4px 14px ${plan.color}60` }
                    : { backgroundColor: 'transparent', border: `1.5px solid ${plan.border}`, color: plan.color }}
                >
                  {plan.cta}
                </button>
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
            <p className="text-white font-bold text-base">Not sure which plan?</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Start free — upgrade anytime. No credit card required.
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
                    style={{ backgroundColor: 'var(--color-tertiary)', borderTop: '1px solid var(--border)', animation: 'fadeSlideDown 0.18s ease forwards' }}
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
