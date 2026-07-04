import "./Button.css";

function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
