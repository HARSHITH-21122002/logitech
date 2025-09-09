from flask import Flask,jsonify
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from dotenv import load_dotenv
from API.vendorsapi import vendor_print
from API.machineapi import machine_print
from API.analyzeapi import analyze_print
from API.paymentsettingapi import payment_print
from API.companyapi import company_print
from API.merchantapi import merchant_print
from API.paymentdetailsapi import paymentdetails_print
from API.orderdetailsapi import orderdetail_print
from API.spiralapi import spiral_print
from API.productapi import product_print
from API.categoriesapi import categories_print
from API.authuserapi import auth_print
from API.stockrefillapi import refill_print
from API.stockreportapi import stock_print
from API.orderitemapi import items_print
from app.db_status import setup_database
from API.adminuserapi import admin_print 
from generate_secret import key_print,JWT_SECRET_KEY
from API.videosapi import video_print
from API.operatorloginapi import operator_print
from phonepe_services import phonepe_bp
from API.modbusconnection import modbus_bp
from API.modbusStatus import modbus_status_bp
from API.modbusController import modbuscontroller_bp
from API.accountApi import account_print
from Printer.printerApi import bill_print
from API.reportApi import report_bp
from API.pine_labs_api import pinelabs_bp
from API.refillreportapi import RefillStock_print
from API.clearstockApi import clearstock_print
from API.rfid_transaction_api import rfid_transaction_bp


load_dotenv()
app=Flask(__name__)
CORS(app)
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
bcrypt=Bcrypt(app)
jwt = JWTManager(app)
setup_database()

app.register_blueprint(vendor_print)
app.register_blueprint(machine_print)
app.register_blueprint(analyze_print)
app.register_blueprint(payment_print)
app.register_blueprint(company_print)
app.register_blueprint(merchant_print)
app.register_blueprint(paymentdetails_print)
app.register_blueprint(orderdetail_print)
app.register_blueprint(spiral_print)
app.register_blueprint(product_print)
app.register_blueprint(auth_print)
app.register_blueprint(categories_print)
app.register_blueprint(refill_print)
app.register_blueprint(stock_print)
app.register_blueprint(items_print)
app.register_blueprint(key_print)
app.register_blueprint(admin_print)
app.register_blueprint(video_print)
app.register_blueprint(operator_print)
app.register_blueprint(phonepe_bp)
app.register_blueprint(modbus_bp)
app.register_blueprint(modbus_status_bp)
app.register_blueprint(modbuscontroller_bp)
app.register_blueprint(account_print)
app.register_blueprint(bill_print)
app.register_blueprint(report_bp)
app.register_blueprint(pinelabs_bp)
app.register_blueprint(RefillStock_print)
app.register_blueprint(clearstock_print)
app.register_blueprint(rfid_transaction_bp)



@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200

    
if __name__== "__main__":
    app.run(debug=True)