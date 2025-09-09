from flask import Flask,jsonify,request,Blueprint
from config import get_modbus_connection
from flask_cors import CORS
from app.database import session,engine,SessionLocal
from models.models import machines_bvc
import datetime
import socket

analyze_print=Blueprint("analyzeapi",__name__)


@analyze_print.route("/check/modbus",methods=["GET"])
def check_modbus():
    try:
        client=get_modbus_connection()  
        if client.connect():
            client.close()
            return jsonify({"status":True,"message":"Modbus Connected",}),200
            
        else:
            return jsonify({"status":False,"message":"Modbus connection Failed"}),500
    except Exception as e:
        return jsonify({"status":False,"message":str(e)}),500
    
@analyze_print.route("/check/internet",methods=["GET"])
def check_internet():
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=2)
        return {"status": "success", "message": "Internet is available"}, 200
    except OSError:
        return {"status": "error", "message": "No internet connection"}, 500
    
@analyze_print.route("/check/sensor",methods=["GET"])
def check_sensor():
    try:
        client=get_modbus_connection()
        
        if client.connect():
            response=client.read_input_registers(address=0, count=1, slave=1)
            client.close()
            if response.isError():
                return jsonify({"status":"Failed","message":"Sensor Read Failed"}),500#Meaning: Python failed to open the COM4 port.
            return jsonify({f"status":"sucess","message":"sensor calibrating sucess{response.registers[0]}"}),200#
        
        else:
            return jsonify({"status":"Failed","message":"sensor connection Failed"}),500
    except Exception as e:
        return jsonify({"status":"error","message":str(e)}),500
    
