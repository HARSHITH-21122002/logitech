from flask import Flask,jsonify,request,Blueprint
from models.models import stock_bvc,products_bvc
from app.database import session,SessionLocal


stock_print=Blueprint("stockreportapi",__name__)

@stock_print.route("/stockregister",methods=["POST"])
def stock():
    session=SessionLocal()
    data=request.get_json()
    try:
        # Extract and validate data
        stock_entry = stock_bvc(
            Machine_Guid=data["Machine_Guid"],
            Motor_number=data["Motor_number"],
            Product_id=data["Product_id"],
            stock=data["stock"],  # Current stock
            Quantity=data["Quantity"],  # Max Capacity
            company_id=data["company_id"]
        )

        # Optional: Remove existing entry for same motor and machine
        session.query(stock_bvc).filter_by(
            Machine_Guid=data["Machine_Guid"],
            Motor_number=data["Motor_number"]
        ).delete()

        session.add(stock_entry)
        session.commit()
        return jsonify({"message": "Stock updated"}), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()
        
@stock_print.route("/stockdetails", methods=["GET"])
def getstock():
    session = SessionLocal()
    try:
        machine_guid = request.args.get("Machine_Guid")

        query = session.query(stock_bvc)

        if machine_guid:
           query = query.filter_by(Machine_Guid = machine_guid)

        query = session.fil(Machine_Guid = machine_guid).all()

        if not stock_list:
            return jsonify({"error": "No stock data found"}), 404

        result = []
        for stock in stock_list:
            result.append({
                "id": stock.id,
                "Machine_Guid": stock.Machine_Guid,
                "Motor_number": stock.Motor_number,
                "Product_id": stock.Product_id,
                "stock": stock.stock,
                "Quantity": stock.Quantity,
                "company_id": stock.company_id
            })

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()        
@stock_print.route("/stock/machine/<string:machine_id>", methods=["GET"])
def get_stock_by_machine(machine_id):
    session = SessionLocal()
    try:
        # --- DEBUGGING: Log the incoming request ---
        print(f"--- Received request for machine ID: '{machine_id}' ---")

        stock_entries = (
            session.query(stock_bvc)
            .filter(stock_bvc.Machine_Guid == machine_id)
            .join(products_bvc, stock_bvc.Product_id == products_bvc.product_id)
            .all()
        )

        # --- DEBUGGING: Log the database query result ---
        print(f"Found {len(stock_entries)} stock entries in the database for this machine.")

        if not stock_entries:
            # If nothing is found, return an empty list immediately.
            return jsonify([])

        response = []
        for entry in stock_entries:
            product = entry.product_id_stock
            response.append({
                "Motor_number": entry.Motor_number,
                "Product_id": product.product_id,
                "Product": {
                    "id": product.product_id,
                    "name": product.product_name,
                    "price": product.price,
                    "image_path": product.image_path,
                },
                "Quantity": entry.Quantity,
                "stock": entry.stock
            })
        

        return jsonify(response)

    except Exception as e:
        # --- DEBUGGING: Log any exceptions that occur ---
        print(f"!!! An error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@stock_print.route("/stock/guid/<string:machine_guid>", methods=["PUT"])
def update_stock_by_guid(machine_guid):
    session = SessionLocal()
    try:
        data = request.get_json()

        # Ensure Motor_number is treated as int
        motor_number = int(data.get("Motor_number"))

        # Correct way to filter with multiple conditions
        stock = session.query(stock_bvc).filter(
            stock_bvc.Machine_Guid == machine_guid,
            stock_bvc.Motor_number == motor_number
        ).first()

        if not stock:
            return jsonify({"error": "stock not found"}), 404

        # Update fields
        stock.Product_id = data.get("Product_id", stock.Product_id)
        stock.stock = data.get("stock", stock.stock)
        stock.Quantity = data.get("Quantity", stock.Quantity)
        stock.company_id = data.get("company_id", stock.company_id)

        session.commit()

        return jsonify({
            "message": "Stock updated successfully",
            "data": {
                "id": stock.id,
                "Machine_Guid": stock.Machine_Guid,
                "Motor_number": stock.Motor_number,
                "Product_id": stock.Product_id,
                "stock": stock.stock,
                "Quantity": stock.Quantity,
                "company_id": stock.company_id
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
                
@stock_print.route("/stocks/<int:filterid>/delete", methods=["DELETE"])
def del_stock(filterid):
    session = SessionLocal()
    try:
        stock_list = session.query(stock_bvc).filter_by(company_id=filterid).all()

        if not stock_list:
            return jsonify({"error": "Stock data not found"}), 404

        for stock in stock_list:
            session.delete(stock)

        session.commit()
        return jsonify({"message": "Stock data deleted successfully"}), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()

@stock_print.route("/stock/vend-decrement", methods=["POST"])
def decrement_stock_after_vend():
    session = SessionLocal()
    data = request.get_json()

    if not data or 'vendedItems' not in data or 'machine_id' not in data:
        return jsonify({"error": "Missing 'vendedItems' or 'machine_id' in request"}), 400

    vended_items = data.get('vendedItems')
    machine_id = data.get('machine_id')

    try:
        for item in vended_items:
            motor_id = item.get('motor_id')
            quantity_vended = item.get('quantity_vended')

            if not motor_id or not isinstance(quantity_vended, int) or quantity_vended <= 0:
                # Skip invalid entries but log them
                print(f"Skipping invalid vending log entry: {item}")
                continue

            # Find the specific stock record for this motor on this machine
            stock_entry = session.query(stock_bvc).filter_by(
                Machine_Guid=machine_id,
                Motor_number=int(motor_id) # Ensure motor_id is treated as an integer
            ).first()

            if stock_entry:
                # Decrement the stock
                new_stock = stock_entry.stock - quantity_vended
                # Ensure stock never goes below zero
                stock_entry.stock = max(0, new_stock)
            else:
                # This indicates a data inconsistency but we shouldn't fail the whole transaction.
                # Log this for later investigation.
                print(f"Warning: Could not find stock entry for Machine '{machine_id}', Motor '{motor_id}' to decrement.")

        # Commit all the changes at once after the loop
        session.commit()
        return jsonify({"message": "Stock successfully updated in database."}), 200

    except Exception as e:
        session.rollback() # Rollback all changes if any error occurs
        print(f"Error during stock decrement: {e}")
        return jsonify({"error": "An internal error occurred while updating stock."}), 500

    finally:
        session.close() # Always close the session
        
@stock_print.route("/stock/kiosk-decrement", methods=["POST"])
def decrement_stock_after_kiosk_vend():
    session = SessionLocal()
    data = request.get_json()

    if not data or 'vendedItems' not in data or 'machine_id' not in data:
        return jsonify({"error": "Missing 'vendedItems' or 'machine_id' in request"}), 400

    vended_items = data.get('vendedItems')
    machine_id = data.get('machine_id')

    try:
        for item in vended_items:
            motor_id_str = item.get('motor_id')
            quantity_vended = item.get('quantity_vended', 1)

        
            if not motor_id_str or not str(motor_id_str).isdigit():
                print(f"Skipping invalid motor_id: {motor_id_str}. Must be an integer.")
                continue

            motor_id = int(motor_id_str)

            if not isinstance(quantity_vended, int) or quantity_vended <= 0:
                print(f"Skipping invalid quantity for motor {motor_id}: {quantity_vended}")
                continue

            stock_entry = session.query(stock_bvc).filter_by(
                Machine_Guid=machine_id,
                Motor_number=motor_id
            ).first()

            if stock_entry:
                current_stock = stock_entry.stock if stock_entry.stock is not None else 0
                stock_entry.stock = max(0, current_stock - quantity_vended)
                print(f"Kiosk Stock Updated → Motor: {motor_id}, New Stock: {stock_entry.stock}")
            else:
                print(f"Warning: No stock found for Motor {motor_id} on Machine {machine_id}")

        session.commit()
        return jsonify({"message": "Kiosk stock updated successfully."}), 200

    except Exception as e:
        session.rollback()
        print(f"CRITICAL ERROR updating kiosk stock: {e}")
        import traceback
        traceback.print_exc() 
        return jsonify({"error": "An unexpected error occurred on the server while updating stock."}), 500

    finally:
        session.close()

    
@stock_print.route("/stock/clear", methods=["POST"])
def clear_stock():
    session = SessionLocal()
    try:
        data = request.get_json()
        machine_id = data.get("machine_id")
        motor_id = data.get("motor_id")  # optional

        if not machine_id:
            return jsonify({"error": "Missing 'machine_id'"}), 400

        # Filter by machine ID (and optionally motor number)
        query = session.query(stock_bvc).filter_by(Machine_Guid=machine_id)

        if motor_id is not None:
            query = query.filter_by(Motor_number=int(motor_id))

        stock_entries = query.all()

        if not stock_entries:
            return jsonify({"message": "No stock entries found for the given criteria."}), 404

        cleared_motors = []

        for stock in stock_entries:
            stock.stock = 0
            cleared_motors.append(stock.Motor_number)

        session.commit()

        return jsonify({
            "message": "Stock cleared successfully.",
            "cleared_motors": cleared_motors
        }), 200

    except Exception as e:
        session.rollback()
        print(f"Error during stock clear: {e}")
        return jsonify({"error": "An error occurred while clearing stock."}), 500
    finally:
        session.close()

# In your Flask backend file (e.g., stock_routes.py)

@stock_print.route("/stock/machine/<string:machine_id>/motor/<int:motor_number>", methods=["DELETE"])
def delete_stock_by_motor(machine_id, motor_number):
    session = SessionLocal()
    try:
        stock_entry_to_delete = (
            session.query(stock_bvc)
            .filter(
                stock_bvc.Machine_Guid == machine_id,
                stock_bvc.Motor_number == motor_number
            )
            .first()
        )

        if stock_entry_to_delete:
            session.delete(stock_entry_to_delete)
            session.commit()
            return jsonify({
                "message": f"Stock for motor {motor_number} deleted successfully."
            }), 200
        else:
            return jsonify({
                "message": f"No stock entry found for motor {motor_number} to delete."
            }), 404

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
