from flask import Flask, jsonify, request, Blueprint
from pymodbus.client import ModbusSerialClient
from pymodbus.exceptions import ModbusException
from modbus import *
import time

modbuscontroller_bp = Blueprint("modbusController", __name__)

# motor_map = {
#     1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
#     11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20,
#     21: 21, 22: 22, 23: 23, 24: 24, 25: 25, 26: 26, 27: 27, 28: 28, 29: 29, 30: 30,
#     31: 31, 32: 32, 33: 33, 34: 34, 35: 35, 36: 36, 37: 37, 38: 38, 39: 39, 40: 40,
#     41: 41, 42: 42, 43: 43, 44: 44, 45: 45, 46: 46, 47: 47, 48: 48, 49: 49, 50: 50,
#     51: 51, 52: 52, 53: 53, 54: 54, 55: 55, 56: 56, 57: 57, 58: 58, 59: 59, 60: 60
# }

motor_map = {
    1: 1,    2: 11,   3:21,     4: 31,   5:41, 
    11: 2,   12: 12,  13:22,    14: 52,  15:15, 
    21: 3,   22: 13,  23: 23,    24: 53,  25:25, 
    31: 4,   32: 14,             34: 34,  35:35, 
    41: 5,   42: 15,  43:24,     44: 44,  45:45, 
    51: 6,   52: 16,  53:25,     54: 54,  55:55,            
    61:7,    62:17,   63:26,     64:37,   65:41, 
}

@modbuscontroller_bp.route("/start/motor/<int:motor_id>", methods=["POST"])
def start_motor(motor_id):
    if motor_id not in motor_map:
        return jsonify({"success": False, "message": f"Motor number {motor_id} does not exist."}), 404

    value_to_write = motor_map[motor_id]
    register_address = 0  # Coil or register address
    status_register = 0   # Input register address for status

    client = ModbusSerialClient(
        port=MODBUS_PORT,
        baudrate=MODBUS_BAUDRATE,
        stopbits=MODBUS_STOPBITS,
        bytesize=MODBUS_BYTESIZE,
        parity=MODBUS_PARITY,
        timeout=MODBUS_TIMEOUT
    )

    try:
        if not client.connect():
            return jsonify({"success": False, "message": "Connection to Modbus failed."}), 400

        response = client.write_register(address=register_address, value=value_to_write)
        if response.isError():
            return jsonify({
                "success": False,
                "message": f"Write failed for motor {motor_id}."
            }), 400

        timeout = 10  # seconds
        start_time = time.time()
        vend_started = False
        vend_success = False
        vend_status = None

        while time.time() - start_time < timeout:
            result = client.read_input_registers(address=status_register, count=1)
            if not result.isError():
                vend_status = result.registers[0]

                if vend_status == 1:
                    vend_started = True  # Vend in progress
                elif vend_status == 2:
                    vend_success = True
                    break
                elif vend_status in (3, 4, 5):
                    break  # Failure states
                else:
                    print(f"[Motor {motor_id}] Unknown status code: {vend_status}")
            time.sleep(0.2)

        # 🔽 Final decision after polling
        if vend_success:
            return jsonify({"success": True, "message": "Vending Completed", "status": vend_status}), 200
        elif vend_status in (3, 4, 5):
            error_message = {
                3: "Error Code 3",
                4: "Out of Stock",
                5: "Motor Jammed"
            }.get(vend_status, "Vending Failed")
            return jsonify({"success": False, "message": error_message, "status": vend_status}), 400
        else:
            return jsonify({"success": False, "message": "Timeout or vending not completed", "status": vend_status}), 408

    except ModbusException as e:
        return jsonify({"success": False, "message": f"Modbus error: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

    finally:
        client.close()
