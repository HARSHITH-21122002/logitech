from flask import Flask,jsonify,request,Blueprint
from models.models import adminuser_bvc,vendors_bvc
from app.database import engine,session,SessionLocal
from generate_secret import generate_key,JWT_SECRET_KEY
from flask_jwt_extended import jwt_manager,jwt_required,create_access_token,get_jwt_identity
from flask_bcrypt import Bcrypt



admin_print=Blueprint("adminuserapi",__name__)
bcrypt=Bcrypt()

@admin_print.route("/adminuser/create", methods=["POST"])
def create_admin_user():
    session = SessionLocal()
    try:
        data = request.get_json()
        
        # Debug logging
        print(f"Received data: {data}")

        # Check for required fields
        required_fields = ["Vendor_id", "userRole", "userAdminName", "user_password"]
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        
        if missing_fields:
            return jsonify({
                "success": False, 
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400

        # Check if user already exists
        existing_user = session.query(adminuser_bvc).filter_by(userAdminName=data["userAdminName"]).first()
        if existing_user:
            return jsonify({"success": False, "message": "User with this email already exists"}), 400

        # Check vendor exists
        vendor = session.query(vendors_bvc).filter_by(Vendor_id=data["Vendor_id"]).first()
        if not vendor:
            return jsonify({"success": False, "message": "Vendor not found"}), 404

        # Hash the user_password
        # Hash the user_password
        hashed_user_password = bcrypt.generate_password_hash(data["user_password"]).decode("utf-8")


        new_user = adminuser_bvc(
            Vendor_id=data["Vendor_id"],
            userRole=data["userRole"],
            userAdminName=data["userAdminName"],
            user_password=hashed_user_password
        )
        session.add(new_user)
        session.commit()
        return jsonify({"success": True, "message": "Admin user created successfully"}), 201
        
    except Exception as e:
        session.rollback()
        print(f"Error creating user: {str(e)}")  # Debug logging
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500
    finally:
        session.close()   
        
             
@admin_print.route("/adminuser", methods=["GET"])
def get_all_admin_users():
    session = SessionLocal()
    try:
        users = session.query(adminuser_bvc).all()
        data = [{
            "id": u.id,
            "Vendor_id": u.Vendor_id,
            "userRole": u.userRole,
            "userAdminName": u.userAdminName,
            "CREATED_AT": u.CREATED_AT,
            "UPDATED_AT": u.UPDATED_AT
        } for u in users]

        return jsonify({"success": True, "data": data}), 200
    finally:
        session.close()

@admin_print.route("/adminuser/update/<int:id>", methods=["PUT"])
def update_admin_user(id):
    session = SessionLocal()
    try:
        data = request.get_json()
        user = session.query(adminuser_bvc).filter_by(id=id).first()
        if not user:
            return jsonify({"success": False, "message": "Admin user not found"}), 404

        user.userRole = data.get("userRole", user.userRole)
        user.userAdminName = data.get("userAdminName", user.userAdminName)
        user.user_password = data.get("user_password", user.user_password)
        user.Vendor_id = data.get("Vendor_id", user.Vendor_id)

        session.commit()
        return jsonify({"success": True, "message": "Admin user updated successfully"}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"success": False, "message": f"Update failed: {str(e)}"}), 500
    finally:
        session.close()
@admin_print.route("/adminuser/delete/<int:id>", methods=["DELETE"])
def delete_admin_user(id):
    session = SessionLocal()
    try:
        user = session.query(adminuser_bvc).filter_by(id=id).first()
        if not user:
            return jsonify({"success": False, "message": "Admin user not found"}), 404

        session.delete(user)
        session.commit()
        return jsonify({"success": True, "message": "Admin user deleted successfully"}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"success": False, "message": f"Delete failed: {str(e)}"}), 500
    finally:
        session.close()