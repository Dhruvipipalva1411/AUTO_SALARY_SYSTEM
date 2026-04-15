import PropTypes from 'prop-types';

/**
 * Reusable Stat Card Component
 * Used in Dashboard for displaying statistics
 */
const StatCard = ({ title, value, icon, color = 'blue', trend, loading = false }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
        red: 'from-red-500 to-red-600'
    };

    const iconBgClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
        red: 'bg-red-100 text-red-600'
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-24 mb-3"></div>
                        <div className="h-8 bg-slate-200 rounded w-32"></div>
                    </div>
                    <div className="w-14 h-14 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 border border-slate-100">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
                    {trend && (
                        <p className={`text-xs mt-2 flex items-center ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.positive ? '↑' : '↓'} {trend.value}
                            <span className="text-slate-500 ml-1">vs last month</span>
                        </p>
                    )}
                </div>
                <div className={`w-14 h-14 rounded-xl ${iconBgClasses[color]} flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
            <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${colorClasses[color]} opacity-20`}></div>
        </div>
    );
};

StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.node.isRequired,
    color: PropTypes.oneOf(['blue', 'green', 'purple', 'orange', 'red']),
    trend: PropTypes.shape({
        positive: PropTypes.bool,
        value: PropTypes.string
    }),
    loading: PropTypes.bool
};

export default StatCard;
