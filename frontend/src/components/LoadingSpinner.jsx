import PropTypes from 'prop-types';

/**
 * Loading Spinner Component
 * Reusable loading indicator with different sizes
 */
const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
    const sizes = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    return (
        <div className="flex flex-col items-center justify-center p-12">
            <div className={`${sizes[size]} border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin`}></div>
            {text && <p className="mt-4 text-slate-600 font-medium">{text}</p>}
        </div>
    );
};

LoadingSpinner.propTypes = {
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    text: PropTypes.string
};

export default LoadingSpinner;
