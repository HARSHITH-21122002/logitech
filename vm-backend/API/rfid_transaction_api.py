from flask import Blueprint, request, jsonify
from app.database import SessionLocal
from sqlalchemy.exc import SQLAlchemyError
from models.models import AccountData
from datetime import datetime

rfid_transaction_bp = Blueprint("rfid_transaction", __name__)

# ✅ Create a new transaction
# ✅ Create a new transaction
@rfid_transaction_bp.route("/transactions", methods=["POST"])
def create_transaction():
    data = request.json
    session = SessionLocal()
    try:
        new_transaction = AccountData(
            rfid=data["rfid"],
            user_name=data.get("user_name"),
            amount=float(data["amount"]),
            balance_after=float(data["balance_after"]),
            order_id=data.get("order_id"),
            product_name=data.get("product_name"),
            quantity=data.get("quantity"),
            transaction_date=datetime.utcnow(),
            # Added fields below with default fallback
            refunded_amount=float(data.get("refunded_amount", 0.0)),
            is_refunded=bool(data.get("is_refunded", False)),
            is_paid=bool(data.get("is_paid", False))
        )   
        session.add(new_transaction)
        session.commit()
        return jsonify({"message": "Transaction recorded successfully."}), 201

    except (KeyError, SQLAlchemyError, ValueError) as e:
        session.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        session.close()

# Get all transactions (same endpoint repeated — consider renaming if needed)
@rfid_transaction_bp.route("/transactions", methods=["POST"])
def gen_transaction():
    data = request.json
    session = SessionLocal()
    try:
        new_transaction = AccountData(
            rfid=data["rfid"],
            user_name=data.get("user_name"),
            amount=float(data["amount"]),
            balance_after=float(data["balance_after"]),
            order_id=data.get("order_id"),
            product_name=data.get("product_name"),
            quantity=data.get("quantity"),
            transaction_date=datetime.utcnow(),
            # Added fields
            refunded_amount=float(data.get("refunded_amount", 0.0)),
            is_refunded=bool(data.get("is_refunded", False)),
            is_paid=bool(data.get("is_paid", False))
        )
        session.add(new_transaction)
        session.commit()
        return jsonify({"message": "Transaction recorded successfully."}), 201
    except (KeyError, SQLAlchemyError) as e:
        session.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        session.close()

#Get transactions by RFID
@rfid_transaction_bp.route("/transactions/rfid/<string:rfid>", methods=["GET"])
def get_transactions_by_rfid(rfid):
    session = SessionLocal()
    try:
        transactions = session.query(AccountData).filter_by(rfid=rfid).order_by(AccountData.transaction_date.desc()).all()
        return jsonify([{
            "transaction_id": t.transaction_id,
            "rfid": t.rfid,
            "user_name": t.user_name,
            "amount": t.amount,
            "balance_after": t.balance_after,
            "order_id": t.order_id,
            "product_name": t.product_name,
            "quantity": t.quantity,
            "transaction_date": t.transaction_date.isoformat(),
            # New fields included in response
            "refunded_amount": t.refunded_amount,
            "is_refunded": t.is_refunded,
            "is_paid": t.is_paid
        } for t in transactions])
    finally:
        session.close()
@rfid_transaction_bp.route("/transactions/update-by-order/<string:order_id>", methods=["PUT"])
def finalize_transaction_by_order(order_id):
    data = request.json
    session = SessionLocal()
    try:
        transaction = session.query(AccountData).filter_by(order_id=order_id).first()
        if not transaction:
            return jsonify({"error": "Transaction not found"}), 404

        # Update fields conditionally
        if "is_paid" in data:
            transaction.is_paid = bool(data["is_paid"])
        if "is_refunded" in data:
            transaction.is_refunded = bool(data["is_refunded"])
        if "refunded_amount" in data:
            transaction.refunded_amount = float(data["refunded_amount"])
            
        if "balance_after" in data:
            transaction.balance_after=float(data["balance_after"])

        session.commit()
        return jsonify({"message": "Transaction updated by order ID successfully"}), 200

    except SQLAlchemyError as e:
        session.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        session.close()
#Get transaction by ID
@rfid_transaction_bp.route("/transactions/<int:transaction_id>", methods=["GET"])
def get_transaction_by_id(transaction_id):
    session = SessionLocal()
    try:
        t = session.query(AccountData).filter_by(transaction_id=transaction_id).first()
        if not t:
            return jsonify({"error": "Transaction not found"}), 404
        return jsonify({
            "transaction_id": t.transaction_id,
            "rfid": t.rfid,
            "user_name": t.user_name,
            "amount": t.amount,
            "balance_after": t.balance_after,
            "order_id": t.order_id,
            "product_name": t.product_name,
            "quantity": t.quantity,
            "transaction_date": t.transaction_date.isoformat()
        })
    finally:
        session.close()
