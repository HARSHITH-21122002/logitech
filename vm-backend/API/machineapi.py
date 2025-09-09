from flask import Flask, jsonify, request, Blueprint
from app.database import SessionLocal
from models.models import machines_bvc, companies_bvc,merchant_bvc
import datetime

machine_print = Blueprint("machineapi", __name__)

@machine_print.route("/machine/register", methods=["POST"])
def machine_register():
    session = SessionLocal()
    try:
        data = request.get_json()

        filtered_company = session.query(companies_bvc).filter_by(company_id = data["company_id"]).first()

        new_machine = machines_bvc(
            Machine_Guid=data["Machine_Guid"],
            AppType=data["AppType"],
            Machinenumber=data["Machinenumber"],
            Name=data["Name"],
            Mac=data["Mac"],
            Location=data["Location"],
            Status="offline",
            Connection_id=data["Connection_id"],
            PgSettingId=2,
            Createdon=datetime.datetime.now(),
            Updatedon=datetime.datetime.now(),
            IsActive=0,
            company_id=data["company_id"],
            Vendor_id = filtered_company.Vendor_id
            
        )

        session.add(new_machine)
        session.commit()
        return jsonify({
            "success":True,
            "message": "Machine registered successfully"
            }), 200
    except Exception as e:
        session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        session.close()
    
@machine_print.route("/get/machine", methods=["GET"])
def get_machines_by_vendor():
    session = SessionLocal()
    try:
        vendor_id = request.args.get("VENDOR_ID")

        if not vendor_id:
            return jsonify({"success": False, "message": "VENDOR_ID query param is required"}), 400

        machines = session.query(machines_bvc).filter_by(Vendor_id=vendor_id).all()

        if not machines:
            return jsonify({"success": True, "machines": [], "message": "No machines found for this vendor"}), 200

        machine_list = []
        for m in machines:
            machine_list.append({
                "Machine_Guid": m.Machine_Guid,
                "AppType": m.AppType,
                "Machinenumber": m.Machinenumber,
                "Name": m.Name,
                "Mac": m.Mac,
                "Location": m.Location,
                "Status": m.Status,
                "Connection_id": m.Connection_id,
                "PgSettingId": m.PgSettingId,
                "Createdon": m.Createdon,
                "Updatedon": m.Updatedon,
                "IsActive": m.IsActive,
                "company_id": m.company_id,
                "Vendor_id": m.Vendor_id
            })

        return jsonify({"success": True, "machines": machine_list}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        session.close()

@machine_print.route("/machine/status", methods=["POST"])
def update_machine_status():
    session = SessionLocal()
    try:
        data = request.get_json()
        machine = session.query(machines_bvc).filter_by(Machine_Guid=data["Machine_Guid"]).first()

        if not machine:
            return jsonify({"status": "error", "message": "Machine not found"}), 404

        machine.Status = data["Status"]  # "online" or "offline"
        machine.Updatedon = datetime.datetime.now()

        session.commit()
        return jsonify({"success": True, "message": f"Machine status updated to {data['Status']}"}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        session.close()


@machine_print.route("/machine/startup", methods=["POST"])
def check_machine():
    session = SessionLocal()
    try:
        data = request.get_json()
        muid = data.get("Machine_Guid")
        mac = data.get("Mac")

        machine = session.query(machines_bvc).filter_by(Mac=mac, Machine_Guid=muid).first()

        if not machine:
            return jsonify({"message": "Machine not connected"}), 404

        machine.Status = "online"
        machine.IsActive = 1
        machine.Updatedon = datetime.datetime.now()
        session.commit()

        return jsonify({"message": "Machine connected successfully"}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        session.close()

@machine_print.route("/machine/shutdown", methods=["POST"])
def machine_shutdown():
    session = SessionLocal()
    try:
        data = request.get_json()
        muid = data.get("Machine_Guid")
        mac = data.get("Mac")

        machine = session.query(machines_bvc).filter_by(Mac=mac, Machine_Guid=muid).first()

        if not machine:
            return jsonify({"message": "Machine not registered"}), 404

        machine.Status = "offline"
        machine.IsActive = 0
        machine.Updatedon = datetime.datetime.now()
        session.commit()

        return jsonify({"status": "success", "message": "Machine set to offline"}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        session.close()

def machine_to_dict(machine):
    return {
       
        
        "company_id": machine.company_id,
        "Machine_Guid": machine.Machine_Guid,
        "Name": machine.Name,
        "AppType": machine.AppType,
        "Machinenumber": machine.Machinenumber,
        "Mac": machine.Mac,
        "Location": machine.Location,
        "Status": machine.Status,
        "Connection_id": machine.Connection_id,
        "PgSettingId": machine.PgSettingId,
        # Safely convert dates to strings
        "Createdon": str(machine.Createdon) if machine.Createdon else None,
        "Updatedon": str(machine.Updatedon) if machine.Updatedon else None,
        "IsActive": machine.IsActive
    }



@machine_print.route("/machines", methods=["GET"])
def get_all_machines():
    session = SessionLocal()
    try:
        # Get both possible query parameters
        machine_id = request.args.get("MACHINE_ID")
        vendor_id = request.args.get("vendor_id") # Use lowercase to match frontend conventions

        # Start the query with a JOIN
        query = session.query(
            machines_bvc, 
            companies_bvc.Vendor_id
        ).outerjoin(
            companies_bvc, machines_bvc.company_id == companies_bvc.company_id
        )

        # --- NEW LOGIC IS HERE ---
        # Apply filters if parameters are provided
        if machine_id:
            query = query.filter(machines_bvc.Machine_id == machine_id)
        
        if vendor_id:
            # We filter on the Vendor_id from the JOINED companies_bvc table
            query = query.filter(companies_bvc.Vendor_id == vendor_id)
        # ---------------------------
        
        results = query.all()
        
        machine_data = []
        for machine, result_vendor_id in results:
             # Handle case where machine has no company (outerjoin result is None)
            vendor_id_to_append = result_vendor_id if result_vendor_id is not None else machine.Vendor_id

            machine_data.append({
                "id": machine.Machine_id,
                "Name": machine.Name,
                "AppType": machine.AppType,
                "Machinenumber": machine.Machinenumber,
                "Location": machine.Location,
                "Machine_Guid": machine.Machine_Guid,
                "Mac": machine.Mac,
                "Status": machine.Status,
                "PgSettingId":machine.PgSettingId,
                # Note: `machine.Vendor_id` might be what you want if it exists on the machine table directly
                # If not, the result_vendor_id from the join is correct.
                "Vendor_id": vendor_id_to_append,
                "Company_id": machine.company_id,
                "Createdon": machine.Createdon,
                "Updatedon": machine.Updatedon
            })
        
        return jsonify({"success": True, "message": "Machine data retrieved successfully.", "data": machine_data}), 200
    except Exception as e:
        session.rollback()
        print(f"Error fetching machines: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        session.close()
        
                
@machine_print.route("/machine/detail/<string:machine_guid>", methods=["GET"])
def get_machine_by_guid(machine_guid):
    session = SessionLocal()
    try:
        machine = session.query(machines_bvc).filter_by(Machine_Guid=machine_guid).first()
        if not machine:
            return jsonify({"error": "Machine not found"}), 404

        machine_data = {
            "Machine_id": machine.Machine_id,
            "Machine_Guid": machine.Machine_Guid,
            "AppType": machine.AppType,
            "Machinenumber": machine.Machinenumber,
            "Name": machine.Name,
            "Mac": machine.Mac,
            "Location": machine.Location,
            "Status": machine.Status,
            "Connection_id": machine.Connection_id,
            "PgSettingId": machine.PgSettingId,
            "Createdon": machine.Createdon.isoformat() if machine.Createdon else None,
            "Updatedon": machine.Updatedon.isoformat() if machine.Updatedon else None,
            "IsActive": machine.IsActive,
            "company_id": machine.company_id
        }

        # Return the data in the format the front-end expects
        return jsonify({
            "success": True,
            "data": [machine_data] # <--- Key change: putting the object in an array
        }), 200
        
    finally:
        session.close()
            
@machine_print.route("/update/machine/<string:guid>", methods=["PUT"])
def update_machine_by_guid(guid): # <-- Function name and parameter changed for clarity
    session = SessionLocal()
    try:
        data = request.get_json()
        required_fields = ["Name", "Location", "AppType", "Machine_Guid", "Mac", "Machinenumber", "PgSettingId"]
        missing_fields = [field for field in required_fields if field not in data or data[field] in [None, ""]]
        if missing_fields:
            return jsonify({
                "success": False,
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        # CHANGE the query to filter by Machine_Guid
        machine = session.query(machines_bvc).filter_by(Machine_Guid=guid).first()
        
        
        if not machine:
            return jsonify({"success": False, "message": "Machine not found"}), 404
        
        if data.get("PgSettingId"):
            pg_setting = session.query(merchant_bvc).filter_by(Merchants_id=data["PgSettingId"]).first()
            if not pg_setting:
                return jsonify({
                    "success": False,
                    "message": f"PgSettingId {data['PgSettingId']} does not exist in merchant settings"
                }), 400
                
        # This update logic is good, it remains the same
        machine.Name = data.get("Name", machine.Name)
        machine.Location = data.get("Location", machine.Location)
        machine.AppType = data.get("AppType", machine.AppType)
        machine.Machine_Guid = data.get("Machine_Guid", machine.Machine_Guid)
        machine.Mac = data.get("Mac", machine.Mac)
        machine.Machinenumber = data.get("Machinenumber", machine.Machinenumber)
        machine.Connection_id = data.get("Connection_id", machine.Connection_id)
        machine.PgSettingId = data.get("PgSettingId", machine.PgSettingId)
        machine.Updatedon = datetime.datetime.utcnow()

        session.commit()

        return jsonify({"success": True, "message": "Machine updated successfully"}), 200

    except Exception as e:
        session.rollback()
        return jsonify({"success": False, "message": f"Update failed: {str(e)}"}), 500
    finally:
        session.close()
        
                    
@machine_print.route("/machine/delete/<string:guid>", methods=["DELETE"])
def delete_machine_by_guid(guid):
    session = SessionLocal()
    try:
        machine = session.query(machines_bvc).filter_by(Machine_Guid=guid).first()

        if not machine:
            return jsonify({"success": False, "message": "Machine not found"}), 404

        session.delete(machine)
        session.commit()

        return jsonify({"success": True, "message": "Machine deleted successfully"}), 200

    except Exception as e:
        session.rollback()
        return jsonify({"success": False, "message": f"Delete failed: {str(e)}"}), 500
    finally:
        session.close()