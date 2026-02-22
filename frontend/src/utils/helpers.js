export const RANGES = [
  { value: '7d',     label: '7 Days'    },
  { value: '14d',    label: '14 Days'   },
  { value: '30d',    label: '30 Days'   },
  { value: '90d',    label: '3 Months'  },
  { value: 'all',    label: 'All Time'  },
  { value: 'custom', label: 'Custom'    },
];

const CATEGORY_STYLES = {
  'Normal':               { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)'   },
  'Elevated':             { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
  'High Stage 1':         { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)' },
  'High Stage 2':         { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)'  },
  'Hypertensive Crisis':  { color: '#dc2626', bg: 'rgba(220,38,38,0.18)',  border: 'rgba(220,38,38,0.5)'   },
  'Low':                  { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)' },
};

const DEFAULT_STYLE = { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.35)' };

export function getCategoryStyle(category) {
  return CATEGORY_STYLES[category] || DEFAULT_STYLE;
}
