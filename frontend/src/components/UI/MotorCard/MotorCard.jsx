import { motion } from "framer-motion"
import "./MotorCard.css"

const MotorCard = ({ motorId, isActive = false, itemCount, onClick, className = "" }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`motor-card ${isActive ? "motor-card--active" : ""} ${className}`}
      onClick={() => onClick && onClick(motorId)}
    >
      <div className="motor-card__content">
        <div className="motor-card__id">{motorId}</div>
        {itemCount !== undefined && (
          <small className="motor-card__count">{itemCount}</small>
        )}
      </div>
    </motion.div>
  )
}

export default MotorCard
