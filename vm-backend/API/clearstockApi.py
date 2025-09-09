from flask import Flask,jsonify,Blueprint,request
from models.models import ClearStockLog
from app.database import engine,SessionLocal,session

clearstock_print=Blueprint("clearstockApi",__name__)

@clearstock_print.route("/clear/stock", methods=["POST"])
def insert_clear_stock():
    session = SessionLocal()
    data = request.get_json()

    try:
        new_log = ClearStockLog(
            machine_guid=data["machine_guid"],
            motor_number=data["motor_number"],
            product_id=data["product_id"],
            product_name=data["product_name"],
            quantity_cleared=data["quantity_cleared"],
            clear_type=data["clear_type"]
        )
        session.add(new_log)
        session.commit()
        return jsonify({"message": "Clear stock log created successfully"}), 201

    except (KeyError) as e:
        session.rollback()
        return jsonify({"error": str(e)}), 400

    finally:
        session.close()
        
@clearstock_print.route("/clear/stock/<string:machine_guid>", methods=["GET"])
def get_clear_stock_logs(machine_guid):
    session = SessionLocal()
    try:
        logs = session.query(ClearStockLog).filter_by(machine_guid=machine_guid).all()
        result = []
        for log in logs:
            result.append({
                "id": log.id,
                "motor_number": log.motor_number,
                "product_name": log.product_name,
                "quantity_cleared": log.quantity_cleared,
                "clear_timestamp": log.clear_timestamp.isoformat(),
                "clear_type": log.clear_type
            })
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()

