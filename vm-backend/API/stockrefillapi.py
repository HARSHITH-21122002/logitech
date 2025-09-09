from flask import Flask,jsonify,request,Blueprint
from models.models import refill_bvc
from app.database import engine,session,SessionLocal

refill_print=Blueprint("stockrefillapi",__name__)

@refill_print.route("/refillregister",methods=["POST"])
def refill_post():
    session=SessionLocal()
    try:
       data=request.get_json()
       
       required_fields = ["Machine_Guid", "Motor_number", "Product_id", "ProductName", "Quantity", "AppType", "company_id"]
       missing = [field for field in required_fields if not data.get(field)]
       if missing:
           return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

       
       new_refill=refill_bvc(
           
           Machine_Guid=data.get("Machine_Guid"),
           Motor_number=data.get("Motor_number"),
           ProductName=data["ProductName"],
           Product_id=data.get("Product_id"),
           Quantity=data["Quantity"],
           company_id=data.get("company_id")
           
           )
       
       session.add(new_refill)
       session.commit()
       
       return jsonify({"message":"successfully refilled"}),200
    
    except Exception as e:
        return jsonify({"error":str(e)})
    finally:
        session.close()
        
@refill_print.route("/refilllogs/<machine_guid>", methods=["GET"])
def get_refill_logs(machine_guid):
    session = SessionLocal()
    try:
        logs = session.query(refill_bvc).filter(refill_bvc.Machine_Guid == machine_guid).all()
        
        if not logs:
            return jsonify({"data": [], "message": "No refill logs found", "success": False}), 404

        result = [
            {
                "id": log.id,
                "Machine_Guid": log.Machine_Guid,
                "Motor_number": log.Motor_number,
                "Product_id": log.Product_id,
                "ProductName": log.ProductName,
                "Quantity": log.Quantity,
                "company_id": log.company_id,
                "created_at": str(log.created_at) if hasattr(log, "created_at") else None
            }
            for log in logs
        ]
        return jsonify({"data": result, "message": "Refill logs retrieved successfully.", "success": True})
    
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500
    finally:
        session.close()

        
@refill_print.route("/refills", methods=["GET"])
def get_refills():
    session = SessionLocal()
    try:
        machine_guid = request.args.get("Machine_Guid")

        query = session.query(refill_bvc)

        if machine_guid:
           query = query.filter_by(Machine_Guid = machine_guid)

        result = query.all()
        
        stock_data = []

        for refill in result:
            stock_data.append({
                "refill_id": refill.refill_id,
                "Motor_number": refill.Motor_number,
                "Product_id": refill.Product_id,
                "ProductName": refill.ProductName,
                "Quantity": refill.Quantity,
                "Refilled_on": refill.Refilled_on.isoformat() if refill.Refilled_on else None,
                "company_id": refill.company_id
            })

        return jsonify({"data":stock_data, "success":True, "message": "Stock data retrived successfully."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
        
@refill_print.route("/refills/<string:machine_Guid>", methods=["GET"])
def getspecific_refill(machine_Guid):
    session = SessionLocal()
    try:
        refills = session.query(refill_bvc).filter_by(Machine_Guid=machine_Guid).all()
        
        if not refills:
            return jsonify({"message": "refill data not found"}), 404

        # Dynamically serialize all columns
        results = []
        for refill in refills:
            refill_dict = {}
            for column in refill.__table__.columns:
                value = getattr(refill, column.name)
                # Format datetime to ISO string if applicable
                if hasattr(value, "isoformat"):
                    value = value.isoformat()
                refill_dict[column.name] = value
            results.append(refill_dict)

        return jsonify(results), 200
    finally:
        session.close()


        
@refill_print.route("/refills/update/<string:filterid>", methods=["PUT"])
def update_refill(filterid):
    session = SessionLocal()
    try:
        data = request.get_json()

        # 1. Find the record by primary key
        refill = session.query(refill_bvc).filter_by(refill_id=filterid).first()

        # 2. If not found, return 404
        if not refill:
            return jsonify({"message": "Refill data not found"}), 404

        # 3. Update fields safely with fallback to existing values
        refill.Machine_Guid = data.get("Machine_Guid", refill.Machine_Guid)
        refill.Motor_number = data.get("Motor_number", refill.Motor_number)
        refill.Product_id = data.get("Product_id", refill.Product_id)
        refill.ProductName = data.get("ProductName", refill.ProductName)
        refill.Quantity = data.get("Quantity", refill.Quantity)
        refill.Refilled_on = data.get("Refilled_on", refill.Refilled_on)
        refill.company_id = data.get("company_id", refill.company_id)

        session.commit()

        return jsonify({"message": "Updated successfully"}), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@refill_print.route("/refill/<string:filterid>/delete",methods=["DELETE"])
def del_refill(filterid):
    session=SessionLocal()
    try:
        data=request.get_json()
        
        refill=session.query(refill_bvc).filter_by(Motor_number=filterid).all()
        
        session.delete(refill)
        session.commit()
        return jsonify({"message":"successfully registered"}),400
    except Exception as e:
        return jsonify({"error":str(e)})
    finally:
        session.close()
        
# @refill_print.route("/stock/vend-decrement", methods=["POST"])
# def decrement_stock_after_vend():
#     session = SessionLocal()
#     try:
#         data = request.get_json()
#         vended_items = data.get("vendedItems", [])

#         if not vended_items:
#             return jsonify({"error": "No vended items provided."}), 400

#         updated = []

#         for item in vended_items:
#             motor_id = str(item.get("motor_id"))  # Ensure it's string if stored that way
#             qty_vended = int(item.get("quantity_vended", 0))

#             if not motor_id or qty_vended <= 0:
#                 continue  # skip invalid items

#             # Get the latest refill record for that motor
#             refill = (
#                 session.query(refill_bvc)
#                 .filter_by(Motor_number=motor_id)
#                 .order_by(refill_bvc.Refilled_on.desc())
#                 .first()
#             )

#             if refill:
#                 # Decrease the quantity, but ensure it doesn’t go below zero
#                 original_qty = refill.Quantity
#                 refill.Quantity = max(0, original_qty - qty_vended)
#                 updated.append({
#                     "Motor_number": motor_id,
#                     "before": original_qty,
#                     "after": refill.Quantity
#                 })

#         session.commit()

#         return jsonify({
#             "message": "Stock updated successfully",
#             "updated": updated
#         }), 200

#     except Exception as e:
#         session.rollback()
#         return jsonify({"error": str(e)}), 500
#     finally:
#         session.close()       
    
        

        
         

    