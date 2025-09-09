from generate_secret import generate_key,JWT_SECRET_KEY
from flask_jwt_extended import jwt_manager,jwt_required,create_access_token,get_jwt_identity
from flask_bcrypt import Bcrypt
from flask import Flask,jsonify,request,Blueprint
from models.models import user_bvc
from app.database import engine,session,SessionLocal

generate_key()

auth_print=Blueprint("authuserapi",__name__)

bcrypt=Bcrypt()

@auth_print.route("/register",methods=["POST"])
def authregister():
    session=SessionLocal()
    try:
        data=request.get_json()
        hashed_password=bcrypt.generate_password_hash(data["password"]).decode("utf-8")
        
        if session.query(user_bvc).filter_by(username=data["username"]).first():
            return jsonify({"message":"Username already exists"}),400
        
        new_user=user_bvc(
            
            username=data["username"],
            email=data["email"],
            password_hash=hashed_password,
            role=data["role"],
            Vendor_id=data.get("Vendor_id"),
            company_id=data.get("company_id")
            )
        session.add(new_user)
        session.commit()
        
        return jsonify({"message":"registered successfully", "success": True}),200
    except Exception as e:
        return jsonify({"error":"registration failed","error":str(e)})
    finally:
        session.close()

@auth_print.route("/login", methods=["POST"])
def loguser():
    session = SessionLocal()
    try:
        data = request.get_json()

        if not data or "password" not in data:
            return jsonify({"success": False, "message": "Password is required"}), 400

        identifier = data.get("username") or data.get("email")  # accept username OR email
        password = data["password"]

        if not identifier:
            return jsonify({"success": False, "message": "Username or email is required"}), 400

        # Check by username first, then by email
        user = (
            session.query(user_bvc)
            .filter((user_bvc.username == identifier) | (user_bvc.email == identifier))
            .first()
        )

        if not user or not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({"success": False, "message": "Invalid username or password"}), 401

        token = create_access_token(identity=user.id)

        return jsonify({
            "success": True,
            "message": "Login successful",
            "access_token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "Vendor_id": user.Vendor_id,
                "company_id": user.company_id
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Login failed",
            "details": str(e)
        }), 500
    finally:
        session.close()

        
@auth_print.route("/get/user/details", methods=["GET"])
# @jwt_required()
def get_current_user():
    session = SessionLocal()
    try:
        users = session.query(user_bvc).all()

        # user = session.query(user_bvc).filter_by(id=user_id).first()
        # if not user:
        #     return jsonify({"error": "User not found"}), 404
         

        user_list = []
        for user in users:
            user_list.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "password": user.password_hash,
                "role": user.role,
                "Vendor_id": user.Vendor_id,
                "Company_id": user.company_id,
                "created_at": user.created_at,
            })
    
        return jsonify({
            "success": True,
            "data": user_list
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch user", "details": str(e)}), 500
    finally:
        session.close()

@auth_print.route("/update/user/<string:user_id>", methods=["PUT"])
def update_user(user_id):
    session = SessionLocal()
    try:
        data = request.get_json()

        user = session.query(user_bvc).filter_by(id=user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Update only if new values are provided
        if "username" in data:
            user.username = data["username"].strip()
        if "email" in data:
            user.email = data["email"].strip()
        if "role" in data:
            user.role = data["role"].strip()

        # 🔑 Only update password if provided
        if "password" in data and data["password"]:
            user.password_hash = bcrypt.generate_password_hash(
                data["password"]
            ).decode("utf-8")

        session.commit()
        return jsonify({"message": "User updated successfully", "success": True}), 200

    except Exception as e:
        session.rollback()
        return jsonify({
            "error": "Failed to update user",
            "details": str(e)
        }), 500
    finally:
        session.close()  



@auth_print.route("/delete/user/<string:user_id>", methods=["DELETE"])
# @jwt_required()
def delete_user(user_id):
    session = SessionLocal()
    try:
        # user_id = get_jwt_identity()

        user = session.query(user_bvc).filter_by(id=user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        session.delete(user)
        session.commit()
        return jsonify({"message": "User deleted successfully", "success":True}), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": "Failed to delete user", "details": str(e)}), 500
    finally:
        session.close()
