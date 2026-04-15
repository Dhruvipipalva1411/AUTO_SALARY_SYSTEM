import PropTypes from 'prop-types';

/**
 * Empty State Component
 * Displays when no data is available
 */
const EmptyState = ({
    icon,
    title = 'No data found',
    description = 'There are no records to display',
    action
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                {icon || (
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                )}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600 mb-6 max-w-md">{description}</p>
            {action && action}
        </div>
    );
};

EmptyState.propTypes = {
    icon: PropTypes.node,
    title: PropTypes.string,
    description: PropTypes.string,
    action: PropTypes.node
};

export default EmptyState;
