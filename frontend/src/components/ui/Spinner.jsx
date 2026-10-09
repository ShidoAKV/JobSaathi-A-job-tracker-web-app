const Spinner = ({ size = 20, className = "" }) => (
  <span
    className={`inline-block animate-spin rounded-full border-2 border-line-strong border-t-primary ${className}`}
    style={{ width: size, height: size }}
    aria-label="Loading"
  />
);

export default Spinner;
