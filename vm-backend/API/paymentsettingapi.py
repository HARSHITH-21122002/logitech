from flask import Flask,jsonify,request,Blueprint
from models.models import payment_bvc,companies_bvc
from app.database import session,engine,SessionLocal
from flask_cors import CORS

payment_print=Blueprint("paymentapi",__name__)
def extract_available_methods(payment):
    methods = []
    if payment.Cash == 1: methods.append("Cash")
    if payment.Upi == 1: methods.append("UPI")
    if payment.Account == 1: methods.append("Account")
    if payment.Card == 1: methods.append("Card")
    if payment.Counter == 1: methods.append("Counter")
    return methods

@payment_print.route("/payment/register",methods=["POST"])
def check_payment():
    session=SessionLocal()
    data=request.get_json()
    if session.query(payment_bvc).filter_by(company_id=data["company_id"]).first():
        return jsonify({"error": "Payment setting for this machine already exists."}), 400
    
    vendor_exists = session.query(companies_bvc).filter_by(company_id=data["company_id"]).first()
    if not vendor_exists:
        return jsonify({"error": "Company Id does not exist"}), 400

        
        
    new_setting = payment_bvc(
        Guid=data.get("Guid"),
        Cash=data.get("cash", 0),
        Upi=data.get("Upi", 0),
        Account=data.get("Account", 0),
        Card=data.get("Card", 0),
        Counter=data.get("Counter", 0),
        company_id=data.get("company_id")
            )
        
    session.add(new_setting)
    session.commit()
    
    return jsonify({
        "message":"success",
        "Guid":new_setting.Guid,
        "available_methods":extract_available_methods(new_setting)
        })


#single machine's available payments
@payment_print.route("/payment/settings/<string:machine_guid>",methods=["GET"])
def get_payment_status(machine_guid):
    session=SessionLocal()
    payment=session.query(payment_bvc).filter_by(Guid=machine_guid).first()
    if not payment:
        return jsonify({"message":"Machine Not Found"}),404
    
    return jsonify({
             "Guid":payment.Guid,
             "available_methods":extract_available_methods(payment)             
        })
    

@payment_print.route("/payment/type/<string:machine_guid>",methods=["GET"])
def get_payment_type(machine_guid):
    session=SessionLocal()
    payment=session.query(payment_bvc).filter_by(Guid=machine_guid).first()
    if not payment:
        return jsonify({"message":"Machine Not Found"}),404
    
    return jsonify({
             "Guid":payment.Guid,
             "available_methods":extract_available_methods(payment)             
        })

 #All machine's available payments   
@payment_print.route("/payment/setting", methods=["GET"])
def get_all_payment():
    settings = session.query(payment_bvc).all()
    result = []

    for r in settings:
        company = session.query(companies_bvc).filter_by(company_id=r.company_id).first()
        
        result.append(
            {
                "Guid": r.Guid,
                "company_id": r.company_id,
                "company_name": company.company_name if company else None,
                "available_methods": extract_available_methods(r)
            }
        )
    
    return jsonify({"success": True, "data": result})


@payment_print.route("/payment/update/<string:company_id>", methods=["PUT"])
def update_payment(company_id):
    if not request.is_json:
        return jsonify({"error": "Invalid request format, expected JSON"}), 415

    data = request.get_json()

    # Find payment record
    payment = session.query(payment_bvc).filter_by(company_id=company_id).first()
    if not payment:
        return jsonify({"error": "Payment setting not found for this company_id."}), 404

    # Update fields only if provided in request
    payment.Guid = data.get("Guid", payment.Guid)
    payment.Cash = data.get("Cash", payment.Cash)
    payment.Upi = data.get("Upi", payment.Upi)
    payment.Account = data.get("Account", payment.Account)
    payment.Card = data.get("Card", payment.Card)
    payment.Counter = data.get("Counter", payment.Counter)
    payment.company_id = data.get("company_id", payment.company_id)

    # Commit changes
    session.commit()

    return jsonify({
        "success": True,
        "message": f"Payment settings for company_id {company_id} updated successfully.",
        "Guid": payment.Guid,
        "available_methods": extract_available_methods(payment)
    }), 200
     

           
@payment_print.route("/payment/delete/<string:company_id>", methods=["DELETE"])
def delete_payment(company_id):
    try:
        payment = session.query(payment_bvc).filter_by(company_id=company_id).first()
        
        if not payment:
            return jsonify({
                "success": False,
                "message": "Payment setting not found for this company."
            }), 404

        session.delete(payment)
        session.commit()

        return jsonify({
            "success": True,
            "message": f"Payment settings for company_id {company_id} deleted successfully."
        }), 200
    
    except Exception as e:
        session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


           
    
    

