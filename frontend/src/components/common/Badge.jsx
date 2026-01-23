import './Badge.css';

function Badge({
  children,
  variant = 'default',
  dot = false,
  className = '',
}) {
  const classes = [
    'badge',
    `badge-${variant}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export default Badge;
