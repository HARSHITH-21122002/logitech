from flask import Flask,jsonify,request,Blueprint
from models.models import paymentdetails_bvc,machines_bvc,ordersdetails_bvc
from app.database import engine,session,SessionLocal
import uuid

paymentdetails_print=Blueprint("paymentdetailsapi",__name__)

@paymentdetails_print.route("/paymentdetail/register", methods=["POST"])
def post_payment():
    session = SessionLocal()
    try:
        data = request.get_json()

        # Required inputs
        company_id = data.get("company_id")
        amount = data.get("Amount")
        order_number = data.get("OrderNumber")
        transaction_id_from_provider = data.get("TransactionId")


        if not company_id:
            return jsonify({"error": "company_id is required"}), 400
        if amount is None:
            return jsonify({"error": "Amount is required"}), 400
        if not order_number:
            return jsonify({"error": "OrderNumber is required"}), 400

        # Optional fields
        payment_method = data.get("PaymentMethod", "UPI")
        payment_provider = data.get("PaymentProvider", "PhonePe")
        user_id = data.get("User_id", str(uuid.uuid4()))

        # Validate machine (needed for Machine_Guid)
        machine = session.query(machines_bvc).filter_by(company_id=company_id).first()
        if not machine:
            return jsonify({"error": "No machine found for the given company_id"}), 404

        # Validate order exists
        order = session.query(ordersdetails_bvc).filter_by(OrderNumber=order_number).first()
        if not order:
            return jsonify({"error": "OrderNumber not found"}), 404

        # transaction_id = str(uuid.uuid4())

        new_payment = paymentdetails_bvc(
            TransactionId=transaction_id_from_provider,
            OrderNumber=order_number,
            PaymentMethod=payment_method,
            PaymentProvider=payment_provider,
            Amount=amount,
            User_id=user_id,
            Machine_Guid=machine.Machine_Guid,
            RefundedAmount=data.get("RefundedAmount", 0.0),
            company_id=company_id,
            IsPaid=True,
            IsSucceed=True
        )

        session.add(new_payment)
        session.commit()

        return jsonify({
            "message": "Payment recorded successfully",
            "TransactionId": transaction_id_from_provider,
            "OrderNumber": order_number
        }), 201

    except Exception as e:
        session.rollback()
        print(f"[Payment Error] {e}")
        import traceback; traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        session.close()
                
@paymentdetails_print.route("/paymentdetail/update/<string:transaction_id>", methods=["PUT"])
def update_payment_status(transaction_id):
    session = SessionLocal()
    try:
        data = request.get_json()
        payment = session.query(paymentdetails_bvc).filter_by(TransactionId=transaction_id).first()

        if not payment:
            return jsonify({"message": "Payment not found"}), 404

        print(f"Incoming refund update: {data}")

        # Safely update fields if present in the request
        if "IsRefunded" in data:
            payment.IsRefunded = bool(data["IsRefunded"])
        if "RefundStatus" in data:
            payment.RefundStatus = data["RefundStatus"]
        if "RefundReason" in data:
            payment.RefundReason = data["RefundReason"]
        if "RefundedAmount" in data:
            payment.RefundedAmount = float(data["RefundedAmount"])
        if "IsPaid" in data:
            payment.IsPaid = bool(data["IsPaid"])
        if "IsSucceed" in data:
            payment.IsSucceed = bool(data["IsSucceed"])

        session.commit()
        print(f"[✅] Updated payment status for {transaction_id}")
        return jsonify({"message": "Payment status updated successfully"}), 200

    except Exception as e:
        session.rollback()
        print(f"[❌] Failed to update payment status: {e}")
        return jsonify({"error": "Failed to update payment status"}), 500

    finally:
        session.close()        
@paymentdetails_print.route("/payment/refundstatus/<transaction_Id>", methods=["PUT"])
def refund_status(transaction_Id):
    session = SessionLocal()
    try:
        data = request.get_json()

        payment = session.query(paymentdetails_bvc).filter_by(TransactionId=transaction_Id).first()

        if not payment:
            return jsonify({"message": "Payment not found"}), 404

        payment.IsRefunded = True
        payment.RefundedAmount = data.get("RefundedAmount", payment.Amount)  # Full refund by default
        payment.RefundReason = data.get("RefundReason", "Auto refund")
        payment.RefundReference = data.get("RefundReference", str(uuid.uuid4()))
        payment.RefundStatus = data.get("RefundStatus", "success")

        session.commit()

        return jsonify({
            "message": "Refund processed",
            "TransactionId": transaction_Id,
            "RefundedAmount": payment.RefundedAmount
        }), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()

@paymentdetails_print.route("/paymentdetail/status/<order_number>", methods=["GET"])
def check_payment_status(order_number):
    session = SessionLocal()
    try:
        payment = session.query(paymentdetails_bvc).filter_by(OrderNumber=order_number).first()

        if not payment:
            return jsonify({
                "status": "pending",
                "message": "No payment found for this order",
                "OrderNumber": order_number
            }), 200

        response = {
            "status": "success" if payment.IsPaid else "pending",
            "OrderNumber": payment.OrderNumber,
            "TransactionId": payment.TransactionId,
            "Amount": payment.Amount,
            "PaymentMethod": payment.PaymentMethod,
            "PaymentProvider": payment.PaymentProvider,
            "IsPaid": payment.IsPaid,
            "IsRefunded": payment.IsRefunded,
            "RefundedAmount": payment.RefundedAmount,
            "RefundReason": payment.RefundReason,
            "RefundReference": payment.RefundReference,
            "RefundStatus": payment.RefundStatus,
            "User_id": payment.User_id,
            "Machine_Guid": payment.Machine_Guid,
            "company_id": payment.company_id,
            "UpdatedAt": payment.UpdatedAt.strftime("%Y-%m-%d %H:%M:%S") if payment.UpdatedAt else None
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()   
          