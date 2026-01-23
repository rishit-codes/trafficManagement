import './LoadingSpinner.css';

function LoadingSpinner({
  size = 'medium',
  text = '',
  fullScreen = false,
  className = '',
}) {
  const content = (
    <div className={`spinner-container ${className}`}>
      <div className={`spinner spinner-${size}`} />
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="spinner-overlay">{content}</div>;
  }

  return content;
}

export default LoadingSpinner;
