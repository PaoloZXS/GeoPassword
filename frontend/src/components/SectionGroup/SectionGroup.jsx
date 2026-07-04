import "./SectionGroup.css";

function SectionGroup({ title }) {
  return (
    <section className="section-group">
      <h3 className="section-title">{title}</h3>
      <div className="section-empty">
        <p>Nessun account presente.</p>
      </div>
    </section>
  );
}

export default SectionGroup;
