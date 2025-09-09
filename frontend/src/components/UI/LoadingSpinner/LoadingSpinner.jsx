import "./LoadingSpinner.css"

const LoadingSpinner = ({ size = "medium", className = "" }) => {
  return (
    <div className={`loading-spinner loading-spinner--${size} ${className}`}></div>
  )
}

export default LoadingSpinner
