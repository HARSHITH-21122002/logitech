from flask import Flask,jsonify,request,Blueprint
from pymodbus.client import ModbusSerialClient
from modbus import *

modbus_bp=Blueprint("modbusconnection",__name__)

@modbus_bp.route("/check/modbus/connection",methods=["POST"])
def check_modbus_connection():
    client=ModbusSerialClient(
        port=MODBUS_PORT,
        baudrate=MODBUS_BAUDRATE,
        stopbits=MODBUS_STOPBITS,
        bytesize=MODBUS_BYTESIZE,
        parity=MODBUS_PARITY,
        timeout=MODBUS_TIMEOUT
        )
    
    try:
        if not client.connect():
            return jsonify({"Success": False, "message":"Modbus Connection Failed"}),400
        
        #Holding register 40001 (address = 0)
        holding_result=client.read_holding_registers(address=0,count=1)
        if holding_result.isError():
            return jsonify({"success":False,"message":"Failed to read modbus connection"})
        
        #Modbus connected successfully
        #check Input Register  30001 (address = 0)
        input_result=client.read_input_registers(address=0,count=1)
        if input_result.isError():
            return jsonify({"success":False,"message":"Failed to read modbus connection"})
        
    except Exception as e:
        return jsonify({"success": False, "message": f"Modbus error: {str(e)}"}), 500
