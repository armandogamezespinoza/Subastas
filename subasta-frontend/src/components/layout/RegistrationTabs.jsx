export default function RegistrationTabs({ value, onChange, tabs }) {
  return (
    <div className="tabs-wrap">
      <div className="segmented-control" role="tablist" aria-label="Tipo de registro">
        {tabs.map(({ value: tabValue, label, detail, icon: Icon }) => {
          const active = value === tabValue;
          return (
            <button
              key={tabValue}
              type="button"
              role="tab"
              id={`tab-${tabValue}`}
              aria-selected={active}
              aria-controls={`panel-${tabValue}`}
              tabIndex={active ? 0 : -1}
              className={`segment ${active ? 'is-active' : ''}`}
              onClick={() => onChange(tabValue)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}<small>{detail}</small></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
