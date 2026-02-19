export const getCategoryStyle = (category) => {
  switch (category) {
    case 'Normal': return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' };
    case 'Elevated': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' };
    case 'High BP Stage 1': return { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' };
    case 'High BP Stage 2': return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' };
    case 'Hypertensive Crisis': return { color: '#dc2626', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.5)' };
    default: return { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' };
  }
};

export const getCategoryDot = (category) => {
  switch (category) {
    case 'Normal': return '#10b981';
    case 'Elevated': return '#f59e0b';
    case 'High BP Stage 1': return '#f97316';
    case 'High BP Stage 2': return '#ef4444';
    case 'Hypertensive Crisis': return '#dc2626';
    default: return '#94a3b8';
  }
};

export const RANGES = [
  { label: 'Today',         value: 'today' },
  { label: 'Last 7 Days',   value: '1w'    },
  { label: 'Last 14 Days',  value: '2w'    },
  { label: 'Last 30 Days',  value: '1m'    },
  { label: 'Last 3 Months', value: '3m'    },
  { label: 'Last 6 Months', value: '6m'    },
  { label: 'All Time',      value: 'all'   },
];