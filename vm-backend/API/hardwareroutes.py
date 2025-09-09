from flask import Blueprint, request, jsonify
from hardware_control import modbus_rotate_motor

hardware_bp = Blueprint('hardware', __name__)

@hardware_bp.route('/hardware/rotate', methods=['POST'])
def rotate_motor():
    data = request.get_json()
    motor_number = data.get("motor_number")

    try:
        modbus_rotate_motor(motor_number)
        return jsonify({"success": True, "message": f"Motor {motor_number} rotated"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
