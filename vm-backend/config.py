from pymodbus.client import ModbusSerialClient as ModbusClient
from app.database import session,SessionLocal
from models.models import ordersdetails_bvc
from models.models import orderitem_bvc
from dotenv import load_dotenv
import os
import base64
import secrets
import os

def get_modbus_connection():
    return ModbusClient(
         port='COM4',
         baudrate=19200,
         stopbits=2,
         bytesize=8,
         timeout=2,
        #  method='rtu'
        )

class Config_Modbus:
    MODBUS_PORT = os.getenv('MODBUS_PORT', 'COM4')
    MODBUS_BAUDRATE = int(os.getenv('MODBUS_BAUDRATE', '19200'))
    MODBUS_BYTESIZE = int(os.getenv('MODBUS_BYTESIZE', '8'))
    MODBUS_PARITY = os.getenv('MODBUS_PARITY', 'N')
    MODBUS_STOPBITS = int(os.getenv('MODBUS_STOPBITS', '2'))
    MODBUS_SLAVE_ID = int(os.getenv('MODBUS_SLAVE_ID', '1'))
    MODBUS_TIMEOUT = int(os.getenv('MODBUS_TIMEOUT', '3'))
    TOTAL_ROWS = 6
    TOTAL_COLUMNS = 10
    TOTAL_MOTORS = 60
    MOTOR_BASE_ADDRESS = 0x0000
    MOTOR_RUN_DURATION = 3  # seconds
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'vending_machine.log')
    
def generate_order_number(session):
    prefix="BVC01V"
    
    last_order=session.query(ordersdetails_bvc).order_by(ordersdetails_bvc.OrderDate.desc()).first()
    if not last_order or not last_order.OrderNumber.startswith(prefix):
        return f"{prefix}0001"
    
    else:
        last_number=int(last_order.OrderNumber.replace(prefix,""))
        new_number=f"{prefix}{last_number + 1:04d}"
        return new_number
    
def img_file_to_base64(image_path):
    with open(image_path,"rb") as image_file:
        encode_string=base64.b64encode(image_file.read()).decode('utf-8')
    return encode_string



# UPLOAD_FOLDER = 'uploads/videos'
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# def video_to_base64(video_path):
#     with open(video_path, "rb") as video_file:
#         encoded_string = base64.b64encode(video_file.read()).decode('utf-8')
#         return encoded_string

# # Example usage:
# video_path = "example_video.mp4"
# base64_string = video_to_base64(video_path)

# # Optional: Save base64 to a .txt file
# with open("output_base64.txt", "w") as f:
#     f.write(base64_string)

# print("Video converted to base64 successfully.")
def generate_order_number(session):
    from sqlalchemy import desc
    last_order = session.query(orderitem_bvc).order_by(desc(orderitem_bvc.id)).first()

    if last_order and last_order.orderNumber.startswith("BVC"):
        try:
            last_num = int(last_order.orderNumber[3:])
        except:
            last_num = 0
    else:
        last_num = 0

    next_num = last_num + 1
    return f"BVC{next_num:05d}"  # BVC00001 format