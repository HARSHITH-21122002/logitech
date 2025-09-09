# from pymodbus.client import ModbusSerialClient as MosbusClient
# from pymodbus.exceptions import ModbusException
# import time
# import logging
# from config import Config_Modbus

# class VendingMachineController:#Motor Controller for 60 motors
    
#     def __init__(self):
#         self.port=Config_Modbus.MODBUS_PORT
#         self.baudrate=Config_Modbus.MODBUS_BAUDRATE
#         self.bytesize=Config_Modbus.MODBUS_BYTESIZE
#         self.parity=Config_Modbus.MODBUS_PARITY
#         self.stopbits=Config_Modbus.MODBUS_STOPBITS
#         self.slaveid=Config_Modbus.MODBUS_SLAVE_ID
#         self.timeout=Config_Modbus.MODBUS_TIMEOUT
#         self.client=None
        
#         self.total_rows=Config_Modbus.TOTAL_ROWS
#         self.total_column=Config_Modbus.TOTAL_COLUMNS
#         self.total_motors=Config_Modbus.TOTAL_MOTORS
#         self.base_address=Config_Modbus.MOTOR_BASE_ADDRESS
#         self.motor_run_duration=Config_Modbus.MOTOR_RUN_DURATION
        
#         self.logger=Config_Modbus.getlogger(__name__)
#         self.logger.setlevel(getattr(logging,Config_Modbus.LOG_FILE))
        
#     def connect_modbus(self):#Established modbus connection
#             try:
#                 self.client=MosbusClient(
#                    port=self.port,
#                    baudrate=self.baudreate,
#                    bytesize=self.bytesize,
#                    parity=self.parity,
#                    stopbits=self.stopbits,
#                    timeout=self.timeout 
#                     )
                
#                 connection=self.client.connect()
                
#                 if connection:
#                     self.logger.info(f"Modbus Serial communication has beeen established on {self.port}")
#                     return True
#                 else:
#                     self.logger.info(f"Modbus communication failed to Connect{self.port}")
#                     return False
                
#             except Exception as e:
#                 self.logger.error(f"Modbus Serial connection error: {e}")
                
#     def disconnect_modbus(self):#closed the modbus
#             if self.client:
#                 self.client.close()
#                 self.logger.info("Modbus Serial Connection Closed")
#                 self.client="None"
        
#     def is_connected(self):
#             return self.client and self.client.connected
        
#     def calculate_motor_address(self, row, column):
            
#             if row<1 or row> self.total.rows:
#                 raise ValueError(f"Invalid row:{row},Must Be 1 -{self.total_rows}")
#             if column<1 or column> self.total.column:
#                 raise ValueError(f"Invalid row:{row},Must Be 1 -{self.total_column}")
            
#             motor_offset=(row-1) * self.total_column +(column+1)
#             return self.base_address+motor_offset
        
#     def parse_motor_position(self, motor_position):
#             if not motor_position or len(motor_position) < 2:
#                 raise ValueError(f"Invalid motor position format: {motor_position}")
            
#             row_letter = motor_position[0].upper()
#             column_str = motor_position[1:]
            
#             try:
#                 column_number = int(column_str)
#                 row = ord(row_letter) - ord('A') + 1
#                 return row, column_number
#             except ValueError:
#                 raise ValueError(f"Invalid motor position format: {motor_position}")
            
#     def run_motor_by_position(self,motor_position,duration="None"):
#             if duration is None:
#                 duration=self.motor_run_duration
                
#             try:
#                 if not self.is_connected():
#                     if not self.connect_modbus():
#                         return False
                    
#                 #place position
#                 row,column=self.parse_motor_position(motor_position)
#                 #calculate motor address
#                 motor_address = self.calculate_motor_address(row, column)
                
#                 self.logger.info(f"Running motor at position {motor_position} (Row {row}, Column {column}) for {duration}s")
                
#                 #Turn on Motor
#                 result=self.client.write_coil(motor_address,True,unit=self.slave_id)
#                 if result.isError():
#                     self.logger.error(f"Failed to start motor:{result}")
#                     return False
#                 #wait for duration
#                 time.sleep(duration)
#                 # Turn off motor
#                 result=self.client.write_coil(motor_address,False,unit=self.slave_id)
#                 if result.isError():
#                     self.logger.error(f"failed to stop motor")
#                     return False
                
#                 self.logger.info(f"Motor at position {motor_position} completed successfully")
#                 return True
            
#             except Exception as e:
#                 self.logger.error(f"Motor control error for position {motor_position}: {e}")
#                 return False
            
#     def test_motor(self, motor_position, duration=1):
#                 return self.run_motor_by_position(motor_position, duration)
                
#     def test_all_motors(self, duration=0.5):
#             results = {}
#             for row in range(1, self.total_rows + 1):
#                 for col in range(1, self.total_columns + 1):
#                     row_letter = chr(ord('A') + row - 1)
#                     position = f"{row_letter}{col}"
#                     success = self.test_motor(position, duration)
#                     results[position] = success
#                     if not success:
#                         self.logger.warning(f"Motor test failed for position {position}")
#             return results
        
            
#     def get_status(self):#Get controller status
#                       return {
#                         'connected': self.is_connected(),
#                         'port': self.port,
#                         'baudrate': self.baudrate,
#                         'total_motors': self.total_motors,
#                         'total_rows': self.total_rows,
#                         'total_columns': self.total_column
#                               }
# motor_controller = VendingMachineController()
from pymodbus.client import ModbusSerialClient as MosbusClient
from pymodbus.exceptions import ModbusException
import time
import logging
from config import Config_Modbus

class VendingMachineController:
    
    def __init__(self):
        self.port = Config_Modbus.MODBUS_PORT
        self.baudrate = Config_Modbus.MODBUS_BAUDRATE
        self.bytesize = Config_Modbus.MODBUS_BYTESIZE
        self.parity = Config_Modbus.MODBUS_PARITY
        self.stopbits = Config_Modbus.MODBUS_STOPBITS
        self.slave_id = Config_Modbus.MODBUS_SLAVE_ID
        self.timeout = Config_Modbus.MODBUS_TIMEOUT
        self.client = None
        
        self.total_rows = Config_Modbus.TOTAL_ROWS
        self.total_columns = Config_Modbus.TOTAL_COLUMNS
        self.total_motors = Config_Modbus.TOTAL_MOTORS
        self.base_address = Config_Modbus.MOTOR_BASE_ADDRESS
        self.motor_run_duration = Config_Modbus.MOTOR_RUN_DURATION
        
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(getattr(logging, Config_Modbus.LOG_LEVEL, "INFO"))
    
    def connect_modbus(self):
        try:
            self.client = MosbusClient(
                port=self.port,
                baudrate=self.baudrate,
                bytesize=self.bytesize,
                parity=self.parity,
                stopbits=self.stopbits,
                timeout=self.timeout
            )
            connection = self.client.connect()
            if connection:
                self.logger.info(f"Modbus connected on {self.port}")
                return True
            else:
                self.logger.warning(f"Modbus failed to connect on {self.port}")
                return False
        except Exception as e:
            self.logger.error(f"Modbus connection error: {e}")
            return False
    
    def disconnect_modbus(self):
        if self.client:
            self.client.close()
            self.logger.info("Modbus connection closed")
            self.client = None

    def is_connected(self):
        return self.client and self.client.connected

    def calculate_motor_address(self, motor_position):
        """
        motor_position: int from 1 to 60
        """
        if motor_position < 1 or motor_position > self.total_motors:
            raise ValueError(f"Invalid motor number: {motor_position}. Must be 1 to {self.total_motors}")
        return self.base_address + (motor_position - 1)

    def run_motor_by_position(self, motor_position, duration=None):
        if duration is None:
             duration = self.motor_run_duration
        try:
            motor_num = int(motor_position)
            if motor_num < 1 or motor_num > self.total_motors:
                 raise ValueError("Invalid motor number")
            if not self.is_connected():
                 if not self.connect_modbus():
                     return False
                 
            motor_address = self.base_address + motor_num - 1
            self.logger.info(f"Running motor {motor_position} at address {motor_address} for {duration}s")
            result = self.client.write_coil(motor_address, True, unit=self.slaveid)
            if result.isError():
                self.logger.error(f"Failed to start motor: {result}")
                return False
            time.sleep(duration)
            
            result = self.client.write_coil(motor_address, False, unit=self.slaveid)
            if result.isError():
                self.logger.error("Failed to stop motor")
                return False
            self.logger.info(f"Motor {motor_position} completed successfully")
            return True
        except Exception as e:
            self.logger.error(f"Motor control error for motor {motor_position}: {e}")
            return False



    def test_motor(self, motor_position, duration=1):
        return self.run_motor_by_position(motor_position, duration)
    

    def test_all_motors(self, duration=0.5):
        results = {}
        for motor_id in range(1, self.total_motors + 1):
            success = self.test_motor(motor_id, duration)
            results[str(motor_id)] = success
            if not success:
                self.logger.warning(f"Motor test failed for #{motor_id}")
        return results

    def get_status(self):
        return {
            "connected": self.is_connected(),
            "port": self.port,
            "baudrate": self.baudrate,
            "total_motors": self.total_motors,
            "total_rows": self.total_rows,
            "total_columns": self.total_columns
        }

# Singleton controller instance
motor_controller = VendingMachineController()
        
                    
