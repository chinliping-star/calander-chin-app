import { Link } from 'react-router-dom';

interface LogoProps {
  /** Size of the logo mark in pixels. Default 40. */
  size?: number;
  /** Show the "Friendiary" wordmark next to the mark. Default true. */
  showText?: boolean;
  /** Wrap in a Link to this path. Omit to render a plain inline logo. */
  to?: string;
  className?: string;
  /** Accessible label / alt text. Default "Friendiary". */
  label?: string;
}

/**
 * Friendiary brand logo. Single source of truth — swap the image or wordmark
 * here and it updates everywhere (navbar, auth pages, etc).
 */
export function Logo({ size = 40, showText = true, to, className, label = 'Friendiary' }: LogoProps) {
  const inner = (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <img
        src="/logo.png"
        alt={label}
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
      {showText && (
        <span
          className="text-xl font-bold italic tracking-tight"
          style={{ color: 'var(--color-primary)', fontFamily: 'var(--heading)' }}
        >
          Friendiary
        </span>
      )}
    </span>
  );

  if (to) {
    return (
      <Link
        to={to}
        aria-label={`${label} home`}
        className="focus-visible:outline-none focus-visible:ring-2 rounded"
        style={{ textDecoration: 'none' }}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
