import "./FieldItem.css";

function FieldItem({ label, value, isPassword = false }) {
  return (
    <div className="field-item">
      <span className="field-label">{label}</span>
      <span className="field-value">{value}</span>
    </div>
  );
}

export default FieldItem;
