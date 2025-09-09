from flask import Flask,jsonify,request,Blueprint
from models.models import RFID,machines_bvc
from app.database import engine,session,SessionLocal
import datetime


account_print=Blueprint("accountApi",__name__)

@account_print.route("/account/register", methods=["POST"])
def register_account():
    session = SessionLocal()
    try:
        data = request.get_json()

        rfid = data.get("RFID")
        name = data.get("Name")
        user_no = data.get("User_No")
        balance = data.get("balance", 0)
        vendor_id = data.get("Vendor_id")   # ✅ Vendor_id
        image_path = data.get("image_path") # ✅ Image Path (optional)

        # Validation
        if not all([rfid, name, user_no, vendor_id]):
            return jsonify({"message": "RFID, Name, User_No, and Vendor_id are required"}), 400

        # Check for duplicate RFID or User_No under the same vendor
        existing_user = session.query(RFID).filter(
            ((RFID.RFID == rfid) | (RFID.User_No == user_no)) &
            (RFID.Vendor_id == vendor_id)
        ).first()
        if existing_user:
            return jsonify({"message": "RFID or User_No already exists for this vendor"}), 409

        # Create new user
        new_user = RFID(
            RFID=rfid,
            Name=name,
            User_No=user_no,
            balance=balance,
            Vendor_id=vendor_id,
            image_path=image_path   # ✅ Save image_path
        )
        session.add(new_user)
        session.commit()

        return jsonify({
            "message": "User registered successfully",
            "user": {
                "RFID": new_user.RFID,
                "Name": new_user.Name,
                "User_No": new_user.User_No,
                "balance": new_user.balance,
                "Vendor_id": new_user.Vendor_id,
                "image_path": new_user.image_path  # ✅ Return image_path
            }
        }), 201

    except Exception as e:
        session.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500
    finally:
        session.close()

        
@account_print.route("/account/details/<string:rfid>",methods=["GET"])
def get_account(rfid):
    session=SessionLocal()
    try:
          account=session.query(RFID).filter_by(RFID=rfid).first()
          
          if not account:
              return jsonify({"message":"account not found"}),404
          
          result={
              "RFID":account.RFID,
              "Name":account.Name,
              "User_No":account.User_No,
              "balance":account.balance   
              
              }
          
          return jsonify(result),200
    finally:
        session.close()
        
@account_print.route("/all/account/details", methods=["GET"])
def get_account_details():
    session = SessionLocal()
    try:
        vendor_id = request.args.get("Vendor_id")  # optional query param

        query = session.query(RFID)

        # filter if Vendor_id provided
        if vendor_id:
            query = query.filter(RFID.Vendor_id == vendor_id)

        accounts = query.all()

        # serialize results
        data = [
            {
                "RFID": acc.RFID,
                "Name": acc.Name,
                "User_No": acc.User_No,
                "balance": acc.balance,
                "Vendor_id": acc.Vendor_id,
                "image_path": acc.image_path
            }
            for acc in accounts
        ]

        return jsonify({"status": "success", "accounts": data}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        session.close()

@account_print.route("/account/details", methods=["GET"])
def get_account_by_vendor_and_rfid():
    session = SessionLocal()
    try:
        vendor_id = request.args.get("Vendor_id")
        rfid = request.args.get("RFID")

        # 2. Validate that both parameters were provided
        if not vendor_id or not rfid:
            return jsonify({
                "success": False,
                "message": "Vendor_id and RFID are required query parameters."
            }), 400 # 400 Bad Request

        account = session.query(RFID).filter(
            RFID.Vendor_id == vendor_id,
            RFID.RFID == rfid
        ).first()

        # 4. Handle the case where the account is NOT found
        if not account:
            return jsonify({
                "success": False,
                "message": "Account not found. You can register a new account."
            }), 404 # 404 Not Found

        # 5. If the account IS found, serialize its data
        account_data = {
            "RFID": account.RFID,
            "Name": account.Name,
            "User_No": account.User_No,
            "balance": account.balance,
            "Vendor_id": account.Vendor_id,
            "image_path": account.image_path
        }

        # 6. Return the success response that the frontend expects
        return jsonify({"success": True, "data": account_data}), 200 # 200 OK

    except Exception as e:
        # Log the error for debugging purposes on the server
        print(f"Error in /account/details: {str(e)}")
        return jsonify({
            "success": False,
            "message": "An internal server error occurred."
        }), 500
    finally:
        session.close()
        
@account_print.route("/account/update/RFID/<string:rfid>", methods=["PUT"])
def update_account(rfid):
    session = SessionLocal()
    try:
        data = request.get_json()

        account = session.query(RFID).filter_by(RFID=rfid).first()

        if not account:
            return jsonify({"message": "account not found"}), 404

        account.Name = data.get("Name", account.Name)
        account.User_No = data.get("User_No", account.User_No)
        account.balance += float(data.get("balance", 0))

        session.commit()
        return jsonify({
            "success": True, 
            "message": "Wallet topped up successfully"
        }), 200

    except Exception as e:
        return jsonify({"message": "error", "error": str(e)}), 500
    finally:
        session.close()

@account_print.route("/clear/balance/<string:rfid>", methods=["PUT"])
def clear_account_balance(rfid):
    session = SessionLocal()
    try:
        account = session.query(RFID).filter(RFID.RFID == rfid).first()
        
        if not account:
            return jsonify({
                "success": False,
                "message": "Account not found."
            }), 404

       
        account.balance = 0
        session.commit()
        
        
        session.refresh(account)

    
        updated_account_data = {
            "RFID": account.RFID,
            "Name": account.Name,
            "User_No": account.User_No,
            "balance": account.balance, 
            "Vendor_id": account.Vendor_id,
            "image_path": account.image_path
        }

        
        return jsonify({
            "success": True,
            "message": "Account balance cleared successfully!",
            "data": updated_account_data
        }), 200

    except Exception as e:
        session.rollback()
        print(f"Error clearing balance: {str(e)}") 
        return jsonify({
            "success": False,
            "message": "An internal server error occurred."
        }), 500
    finally:
        session.close()

@account_print.route("/account/delete/<string:rfid>", methods=["DELETE"])
def delete_account(rfid):
    session = SessionLocal()
    try:
        if not rfid:
            return jsonify({"success": False, "message": "RFID is missing from the URL"}), 400


        account = session.query(RFID).filter_by(RFID=rfid).first()
        
        if not account:
            return jsonify({"success": False, "message": "Account not found"}), 404

        session.delete(account)
        session.commit()
        
        return jsonify({"success": True, "message": "Account deleted successfully"}), 200

    except Exception as e:
        session.rollback()
        return jsonify({"success": False, "message": f"An error occurred: {str(e)}"}), 500
    finally:
        session.close()
    


# @account_print.route("/transactions/rfid/<string:rfid>", methods=["GET"])
# def get_transactions_by_rfid(rfid):
#     session = SessionLocal()
#     try:
#         user = (
#             session.query(RFID)
#             .filter(RFID.RFID == rfid)
#             .first()
#         )

#         if not user:
#             return jsonify({"message": f"No user found for RFID {rfid}"}), 404

#         result = [
#             {
#                 "RFID": user.RFID,
#                 "Name": user.Name,
#                 "User_No": user.User_No
#             }
#         ]

#         return jsonify({"transactions": result}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#     finally:
#         session.close()


