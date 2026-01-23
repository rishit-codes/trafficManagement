import './Button.css';

function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  type = 'button',
  onClick,
  className = '',
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;
