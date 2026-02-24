export default function StatCard({ title, value, subtitle, icon, color = 'primary' }) {
  const colorMap = {
    primary: 'border-l-primary',
    secondary: 'border-l-secondary',
    accent: 'border-l-accent',
    info: 'border-l-info',
    success: 'border-l-success',
    warning: 'border-l-warning',
    error: 'border-l-error',
  };

  return (
    <div className={`bg-white rounded-lg border-l-4 ${colorMap[color]} p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg bg-base-200`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
