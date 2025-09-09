import MotorCard from "../MotorCard/MotorCard"
import "./MotorGrid.css"

const MotorGrid = ({ motors, onMotorClick, selectedMotor, className = "" }) => {
  return (
    <div className={`motor-grid ${className}`}>
      {Array.from({ length: 60 }, (_, index) => {
        const motorId = index + 1
        const motor = motors.find(m => m.id === motorId)
        
        return (
          <MotorCard
            key={motorId}
            motorId={motorId}
            isActive={motor?.isActive || selectedMotor === motorId}
            itemCount={motor?.itemCount}
            onClick={onMotorClick}
          />
        )
      })}
    </div>
  )
}

export default MotorGrid
