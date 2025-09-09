from flask import Flask,jsonify,Blueprint
from pymodbus.client import ModbusSerialClient
from pymodbus.exceptions import ModbusException
from modbus import *

modbus_status_bp=Blueprint("modbuStatus",__name__)

@modbus_status_bp.route("/modbus/status",methods=["GET"])
def check_modbus_status():
    status_register_address=0 #Reading from 30001
    
    client= ModbusSerialClient(
        port=MODBUS_PORT,
        baudrate=MODBUS_BAUDRATE,
        stopbits=MODBUS_STOPBITS,
        bytesize=MODBUS_BYTESIZE,
        parity=MODBUS_PARITY,
        timeout=MODBUS_TIMEOUT
        )
    
    try:
        if not client.connect():
            return jsonify({
                "success": False,
                "message": "Failed to connect to Modbus"
                }),400
            
        result = client.read_input_registers(address=status_register_address,count=1)
        
        if result.isError():
            return jsonify({
                "success": False,
                "message": "Failed to read Modbus status register"
            }), 500
        status = result.registers[0]
        
        return jsonify({
            "success": True,
            "message": "Modbus status read successfully",
            "status": status
            }), 200
    except ModbusException as e:
        return jsonify({"success": False, "message": f"Modbus error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500
    finally:
        client.close()
        
    
