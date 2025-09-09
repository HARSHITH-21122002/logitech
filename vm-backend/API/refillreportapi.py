from flask import Flask,jsonify,request,Blueprint
from models.models import RefillStock
from app.database import engine,session,SessionLocal
from flask_cors import CORS


RefillStock_print=Blueprint("refillreportapi",__name__)

@RefillStock_print.route("/stock/required",methods=["POST"])
def stock_post():
    session=SessionLocal()
    try:
        data=request.get_json()
        
        required_fields=['machine_guid','motor_number','product_id','product_name','quantity_added','stock_before_refill','stock_after_refill']
        missing_field=[field for field in required_fields if field not in data]
        
        if missing_field:
            return jsonify({"error": f"Missing fields: {', '.join(missing_field)}"}),400
        
        new_stock=RefillStock(
            machine_guid=data['machine_guid'],
            motor_number=data['motor_number'],
            product_id=data['product_id'],
            product_name=data['product_name'],
            quantity_added=data['quantity_added'],
            stock_before_refill=data['stock_before_refill'],
            stock_after_refill=data['stock_after_refill']
            
            )
        
        session.add(new_stock)
        session.commit()
        return jsonify({"success":True,"message":"Stock refill details saved successfully."}), 200
    except Exception as e:
        return jsonify({"message":f"Failed to store stock report{e}"})
    
    finally:
        session.close()
        
@RefillStock_print.route("/stock/required/<string:machine_guid>",methods=["GET"])
def stock_get(machine_guid):
    session=SessionLocal()
    try:
        refill_logs = session.query(RefillStock).filter(RefillStock.machine_guid == machine_guid).all()

        # Format the response as a list of dicts
        result = []
        for log in refill_logs:
            result.append({
                "id": log.id,
                "motor_number": log.motor_number,
                "product_id": log.product_id,
                "product_name": log.product_name,
                "quantity_added": log.quantity_added,
                "stock_before_refill": log.stock_before_refill,
                "stock_after_refill": log.stock_after_refill,
                "refill_timestamp": log.refill_timestamp.isoformat() if log.refill_timestamp else None
            })

        return jsonify({"success": True, "data": result}), 200

    except Exception as e:
        session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        session.close()