from flask import Flask,request,jsonify,Blueprint
from models.models import ordersdetails_bvc,machines_bvc,vendors_bvc,companies_bvc
from app.database import session,SessionLocal
from config import generate_order_number
import uuid
from datetime import datetime

orderdetail_print=Blueprint("orderdetailsapi",__name__)


@orderdetail_print.route("/order/create", methods=["POST"])
def post_order():
    session = SessionLocal()
    try:
        data = request.get_json()

        company_id = data.get("company_id")
        if not company_id:
            return jsonify({"error": "company_id is required"}), 400

        # Fetch company and vendor via company
        company = session.query(companies_bvc).filter_by(company_id=company_id).first()
        if not company:
            return jsonify({"error": "Company not found"}), 404

        vendor = session.query(vendors_bvc).filter_by(Vendor_id=company.Vendor_id).first()
        if not vendor:
            return jsonify({"error": "Vendor not found for company"}), 404

        shortname = vendor.shortname

        # Fetch any machine for this vendor
        machine = session.query(machines_bvc).filter_by(company_id=company.company_id).first()
        if not machine:
            return jsonify({"message": "Machine not found for vendor"}), 404

        # Count existing orders for this vendor
        existing_order = (
            session.query(ordersdetails_bvc)
            .join(companies_bvc, ordersdetails_bvc.company_id == companies_bvc.company_id)
            .filter(companies_bvc.Vendor_id == vendor.Vendor_id)
            .count()
        )

        order_id = f"OR-{uuid.uuid4()}"
        order_number = f"{shortname}{existing_order + 1:04d}"

        new_order = ordersdetails_bvc(
            Order_id=order_id,
            OrderNumber=order_number,
            OrderDate=datetime.utcnow(),
            Total=data["Total"],
            Machine_Guid=machine.Machine_Guid,
            DeliveryType=data["DeliveryType"],
            PaymentType=data.get("PaymentType"),
            IsPaid=data.get("IsPaid", False),
            IsRefunded=data.get("IsRefunded", False),
            RefundedAmount=data.get("RefundedAmount", 0.0),
            PaymentId=data.get("PaymentId"),
            company_id=company_id,
            vendor_id=vendor.Vendor_id
        )

        session.add(new_order)
        session.commit()

        return jsonify({
            "message": "Order created",
            "Order_id": order_id,
            "OrderNumber": order_number
        }), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
                  
@orderdetail_print.route("/order/<int:filterid>",methods=["GET"])
def get_order(filterid):
    session=SessionLocal()
    try:
        order=session.query(ordersdetails_bvc).filter_by(Vendor_id=filterid).first()
        if not order:
            return jsonify({"message":"order not found"})
        
        return jsonify(
            {
            "Order_id":order.Order_id,
            "OrderNumber": order.OrderNumber,
            "OrderDate": str(order.OrderDate),
            "Total": order.Total,
            "Machine_Guid": order.Machine_Guid,
            "DeliveryType": order.DeliveryType,
            "PaymentType": order.PaymentType,
            "IsPaid": order.IsPaid,
            "IsRefunded": order.IsRefunded,
            "RefundedAmount": order.RefundedAmount,
            "PaymentId": order.PaymentId,
            "Vendor_id": order.Vendor_id
                
                }),200
    finally:
        session.close()

@orderdetail_print.route("/order/<int:filterid>",methods=["PUT"])
def update_refund(filterid):
    session=SessionLocal()
    try:
        data = request.get_json()
        order=session.query(ordersdetails_bvc).filter_by(vendor_id=filterid).first()
        if not order:
            return jsonify({"message":"order not found"})
        
        order.IsPaid=data.get("IsPaid",order.IsPaid)
        order.IsRefunded=data.get("IsRefunded",order.IsRefunded)
        order.RefundedAmount=data.get("RefundedAmount",order.RefundedAmount)
        
        
        session.commit()
        return jsonify({
            "message":"order status updated"
            })
    
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()