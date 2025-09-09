from flask import Flask, jsonify, Blueprint, request
from flask_bcrypt import Bcrypt
from models.models import operatorlogin_bvc
from app.database import SessionLocal
from sqlalchemy.exc import IntegrityError

operator_print = Blueprint("operatorloginapi", __name__)
bcrypt = Bcrypt()

@operator_print.route("/operator/create", methods=["POST"])
def create_operator():
    session = SessionLocal()
    try:
        data = request.get_json()
        hashed_password = bcrypt.generate_password_hash(data["password"]).decode('utf-8')

        new_operator = operatorlogin_bvc(
            username=data["username"],
            password=hashed_password,
            company_id=data["company_id"]
        )
        session.add(new_operator)
        session.commit()
        return jsonify({"message": "Operator created successfully"}), 201

    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Username already exists or invalid company ID"}), 400
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@operator_print.route("/operator/login", methods=["POST"])
def login_operator():
    session = SessionLocal()
    try:
        data = request.get_json()
        user = session.query(operatorlogin_bvc).filter_by(username=data["username"]).first()

        if not user or not bcrypt.check_password_hash(user.password, data["password"]):
            return jsonify({"success": False, "message": "Invalid username or password"}), 401

        return jsonify({
            "success": True,
            "message": "Login successful",
            "operator_id": user.id,
            "company_id": user.company_id
        }), 200
    finally:
        session.close()

@operator_print.route("/operator/<int:op_id>", methods=["GET"])
def get_operator_by_id(op_id):
    session = SessionLocal()
    try:
        op = session.query(operatorlogin_bvc).get(op_id)
        if not op:
            return jsonify({"error": "Operator not found"}), 404

        return jsonify({
            "id": op.id,
            "username": op.username,
            "company_id": op.company_id,
            "company_name": op.operator_company.company_name if op.operator_company else None
        }), 200
    finally:
        session.close()


@operator_print.route("/operator/update/<int:op_id>", methods=["PUT"])
def update_operator(op_id):
    session = SessionLocal()
    try:
        data = request.get_json()
        op = session.query(operatorlogin_bvc).get(op_id)
        if not op:
            return jsonify({"error": "Operator not found"}), 404

        if "username" in data:
            op.username = data["username"]

        if "password" in data:
            hashed_password = bcrypt.generate_password_hash(data["password"]).decode('utf-8')
            op.password = hashed_password

        if "company_id" in data:
            op.company_id = data["company_id"]

        session.commit()
        return jsonify({"message": "Operator updated successfully"}), 200

    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Username already exists or invalid company ID"}), 400
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
