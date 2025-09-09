from flask import Flask,jsonify,request,Blueprint
from models.models import merchant_bvc
from app.database import engine,session,SessionLocal


merchant_print=Blueprint("merchantapi",__name__)

@merchant_print.route("/merchant/register", methods=["POST"])
def post_merchant():
    session = SessionLocal()
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400

        required_fields = [
            "Vendor_id", "Merchants_id", "Gatewayname", "ProviderID",
            "ProviderName", "MerchantId", "MerchantName", "MerchantVPA", "MCC",
            "KeyIndex", "BaseUrl", "PublicKeyPath", "PrivateKeyPath"
        ]
        missing = [f for f in required_fields if f not in data or not data[f]]
        if missing:
            return jsonify({"success": False, "message": f"Missing required fields: {', '.join(missing)}"}), 400

        # Check if this Vendor already has this gateway registered
        existing = session.query(merchant_bvc).filter_by(
            Vendor_id=data["Vendor_id"],
            MerchantKey=data["MerchantKey"],
        ).first()

        if existing:
            return jsonify({
                "success": False,
                "message": f"Vendor {data['Vendor_id']} already has gateway {data['Gatewayname']} registered"
            }), 409  # Conflict

        # Insert new payment gateway row
        new_setting = merchant_bvc(
            Merchants_id=data["Merchants_id"],
            Gatewayname=data["Gatewayname"],
            ProviderID=data["ProviderID"],
            ProviderName=data["ProviderName"],
            MerchantId=data["MerchantId"],
            MerchantName=data["MerchantName"],
            MerchantVPA=data["MerchantVPA"],
            MerchantKey=data.get("MerchantKey"),
            MCC=data["MCC"],
            KeyIndex=data["KeyIndex"],
            BaseUrl=data["BaseUrl"],
            PublicKeyPath=data["PublicKeyPath"],
            PrivateKeyPath=data["PrivateKeyPath"],
            Vendor_id=data["Vendor_id"],
        )

        session.add(new_setting)
        session.commit()
        return jsonify({"success": True, "message": "Merchant payment gateway registered successfully"}), 200

    except Exception as e:
        session.rollback()
        return jsonify({"success": False, "message": f"Internal server error: {str(e)}"}), 500
    finally:
        session.close()

        
@merchant_print.route("/merchant", methods=["GET"])
def get_merchant():
    session = SessionLocal()
    try:
        merchants = session.query(merchant_bvc).all()

        if not merchants:
            return jsonify({"message": "No merchants found"}), 404

        merchant_list = [
            {
                "Gatewayname": m.Gatewayname,
                "ProviderID": m.ProviderID,
                "ProviderName": m.ProviderName,
                "MerchantId": m.MerchantId,
                "MerchantName": m.MerchantName,
                "MerchantVPA": m.MerchantVPA,
                "MerchantKey": m.MerchantKey,
                "MCC": m.MCC,
                "KeyIndex": m.KeyIndex,
                "Baseurl": m.BaseUrl,
                "PublicKeyPath": m.PublicKeyPath,
                "PrivateKeyPath": m.PrivateKeyPath,
                "Vendor_id": m.Vendor_id
            }
            for m in merchants
        ]

        return jsonify({
            "message": "success",
            "data": merchant_list
        }), 200

    finally:
        session.close()


@merchant_print.route("/merchantdetails/<int:Vendor_id>", methods=["GET"])
def get_merchantdetails(Vendor_id):
    session = SessionLocal()
    try:
        merchant = session.query(merchant_bvc).filter_by(Vendor_id=Vendor_id).first()

        if not merchant:
            return jsonify({"message": "Merchant not found"}), 404

        return jsonify({
            "message": "success", 
            "data": {
                "Gatewayname": merchant.Gatewayname,
                "ProviderID": merchant.ProviderID,
                "ProviderName": merchant.ProviderName,
                "MerchantId": merchant.MerchantId,
                "MerchantName": merchant.MerchantName,
                "MerchantVPA": merchant.MerchantVPA,
                "MerchantKey": merchant.MerchantKey,
                "MCC": merchant.MCC,
                "KeyIndex": merchant.KeyIndex,
                "Baseurl": merchant.BaseUrl,
                "PublicKeyPath": merchant.PublicKeyPath,
                "PrivateKeyPath": merchant.PrivateKeyPath,
                "Vendor_id": merchant.Vendor_id
            }
        }), 200
    finally:
        session.close()


@merchant_print.route("/merchant/update/<int:company_id>",methods=["PUT"])
def update_merchant(company_id):
    session=SessionLocal()
    try:
        data=request.get_json()
        merchant=session.query(merchant_bvc).filter_by(company_id=company_id).first()
        if not merchant:
            return jsonify({"message":"Merchant not found"}),404
        
        merchant.Gatewayname=data.get("Gatewayname",merchant.Gatewayname)
        merchant.ProviderID=data.get("ProviderID",merchant.ProviderID)
        merchant.ProviderName=data.get("ProviderName",merchant.ProviderName)
        merchant.MerchantId=data.get("MerchantId",merchant.MerchantId)
        merchant.MerchantName=data.get("MerchantName",merchant.MerchantName)
        merchant.MerchantVPA=data.get("MerchantVPA",merchant.MerchantVPA)
        merchant.MerchantKey=data.get("MerchantKey",merchant.MerchantKey)
        merchant.MCC=data.get("MCC",merchant.MCC)
        merchant.KeyIndex=data.get("KeyIndex",merchant.KeyIndex)
        merchant.BaseUrl=data.get("BaseUrl",merchant.BaseUrl)
        merchant.PublicKeyPath=data.get("PublicKeyPath",merchant.PublicKeyPath)
        merchant.PrivateKeyPath=data.get("PrivateKeyPath",merchant.PrivateKeyPath)
        merchant.Vendor_id=data.get("Vendor_id",merchant.Vendor_id)
        
        session.commit()
        
        return jsonify({"message":"updated successfully"}),200
    
    
    finally:
        session.close()
        
@merchant_print.route("/merchant/delete/<int:company_id>", methods=["DELETE"])
def delete_merchant(company_id):
    session = SessionLocal()
    try:
        merchant = session.query(merchant_bvc).filter_by(company_id=company_id).first()
        if not merchant:
            return jsonify({"message": "Merchant not found"}), 404

        session.delete(merchant)
        session.commit()
        return jsonify({"message": "Deleted Successfully"}), 200

    except Exception as e:
        session.rollback()
        print(f"❌ Delete error: {e}")  # <-- will show exact error in terminal
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500

    finally:
        session.close()
