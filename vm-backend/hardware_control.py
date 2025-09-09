from pymodbus.client.sync import ModbusSerialClient

def modbus_rotate_motor(motor_number):
    # Example: motor_number maps to Modbus coil or holding register
    motor_address = get_address_for_motor(motor_number)  # implement this mapping
    client = ModbusSerialClient(
        method='rtu',
        port='COM4',        # or '/dev/ttyUSB0' for Linux
        baudrate=9600,
        timeout=1
    )

    if not client.connect():
        raise Exception("Unable to connect to Modbus device")

    # Send signal to rotate motor
    # Example: write coil True to start motor
    client.write_coil(motor_address, True, unit=1)
    client.close()
