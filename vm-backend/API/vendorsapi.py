from flask import Flask,jsonify,Blueprint,request
from models.models import vendors_bvc
from app.database import session,SessionLocal
from datetime import datetime

vendor_print=Blueprint("vendorsapi",__name__)

@vendor_print.route("/vendors/create", methods=["POST"])
def create_vendor():
    session = SessionLocal()
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "Invalid or missing JSON payload"
            }), 400

        # Check required fieldsa
        for field in ["Name", "shortname", "Mail"]:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400

        # Create and store new vendor
        new_vendor = vendors_bvc(
            Name=data["Name"],
            shortname=data["shortname"],
            Mail=data["Mail"],
            CreatedOn=datetime.utcnow(),
            IsActive=data.get("IsActive", 1)
        )
        session.add(new_vendor)
        session.commit()

        return jsonify({
            "success": True,
            "message": "Vendor registered successfully!",
            "id": new_vendor.Vendor_id
        }), 201

    except Exception as e:
        session.rollback()
        return jsonify({
            "success": False,
            "message": "Vendor creation failed",
            "error": str(e)
        }), 500
    finally:
        session.close()

                
@vendor_print.route("/vendors/all", methods=["GET"])
def get_all_vendors():
    session = SessionLocal()
    try:
        vendors = session.query(vendors_bvc).all()
        result = [
            {
                "id": v.Vendor_id,
                "Name": v.Name,
                "shortname": v.shortname,
                "Mail": v.Mail,
                "CreatedOn": v.CreatedOn,
                "IsActive": v.IsActive
            } for v in vendors
        ]
        return jsonify({
            "success": True,
            "data": result
        }), 200
    finally:
        session.close()

        
@vendor_print.route("/vendors/<int:vendor_id>", methods=["GET"])
def get_vendor(vendor_id):
    session = SessionLocal()
    try:
        vendor = session.get(vendors_bvc, vendor_id)  
        if not vendor:
            return jsonify({"success": False, "message": "Vendor not found"}), 404

        return jsonify({
            "success": True,
            "data": {
                "id": vendor.Vendor_id,
                "Name": vendor.Name,
                "shortname": vendor.shortname,
                "Mail": vendor.Mail,
                "CreatedOn": vendor.CreatedOn,
                "IsActive": vendor.IsActive
            }
        }), 200
    finally:
        session.close()
        
@vendor_print.route("/vendors/update/<int:vendor_id>", methods=["PUT"])
def update_vendor(vendor_id):
    
    data = request.get_json()
    session = SessionLocal()
    try:
        vendor = session.query(vendors_bvc).get(vendor_id)
        if not vendor:
            return jsonify({"success": False, "error": "Vendor not found"}), 404

        vendor.Name = data.get("Name", vendor.Name)
        vendor.shortname = data.get("shortname", vendor.shortname)
        vendor.Mail = data.get("Mail", vendor.Mail)
        vendor.IsActive = data.get("IsActive", vendor.IsActive)

        session.commit()
        return jsonify({
            "success": True,
            "message": "Vendor updated successfully"
        })
    except Exception as e:
        session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        session.close()

@vendor_print.route("/vendors/delete/<int:vendor_id>", methods=["DELETE"])
def delete_vendor(vendor_id):
    session = SessionLocal()
    try:
        vendor = session.query(vendors_bvc).get(vendor_id)
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404

        session.delete(vendor)
        session.commit()
        return jsonify({
            "success": True,
            "message": "Vendor deleted"})
    finally:
        session.close()


