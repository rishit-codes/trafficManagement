import './Card.css';

function Card({
  children,
  title,
  subtitle,
  footer,
  className = '',
}) {
  const hasHeader = title || subtitle;

  return (
    <div className={`card ${className}`}>
      {hasHeader && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
