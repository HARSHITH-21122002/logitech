from models.models import companies_bvc,vendors_bvc
from flask import Flask,request,jsonify,Blueprint
from app.database import session,SessionLocal


company_print=Blueprint("companyapi",__name__)

@company_print.route("/company/register", methods=["POST"])
def post_company():
    session = SessionLocal()
    try:
        data = request.get_json()

        # Validate mandatory Vendor_id
        try:
            Vendor_id = data["Vendor_id"]  # Required
        except KeyError:
            return jsonify({"error": "Vendor_id is required"}), 400

        # Check if Vendor exists
        vendor = session.query(vendors_bvc).filter_by(Vendor_id=Vendor_id).first()
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404

        # Optional: Check if the same company is already registered for this vendor
        existing_company = session.query(companies_bvc).filter_by(
            Vendor_id=Vendor_id,
            company_name=data.get("company_name")
        ).first()

        if existing_company:
            return jsonify({"message": "Company already registered"}), 400

        # Create new company
        new_company = companies_bvc(
            Vendor_id=Vendor_id,  # Use validated variable
            company_name=data["company_name"],
            company_Address=data["company_Address"],
            company_phone=data["company_phone"],
            GSTNumber=data["GSTNumber"]
        )

        session.add(new_company)
        session.commit()

        return jsonify({
            'success':True,
            "message": "Company registered successfully"
            }), 200

    finally:
        session.close()
        
@company_print.route("/get/company/<int:company_id>",methods=["GET"])
def get_company(company_id):
    session = SessionLocal()
    try:
        company=session.query(companies_bvc).filter_by(company_id=company_id).first()
        
        return jsonify({
                 "company_id":company.company_id,
                 "company_name":company.company_name,
                 "company_Address":company.company_Address,
                 "company_phone":company.company_phone,
                 "GSTNumber":company.GSTNumber,
                 "Vendor_id":company.Vendor_id,
                 "created_at": company.created_at,
                 "updated_at": company.updated_at               
            
            })
    finally:
        session.close()

@company_print.route("/company/details", methods=["GET"])
def get_all_companies():
    session = SessionLocal()
    try:
        companies = session.query(companies_bvc).all()
        if not companies:
            return jsonify({"message": "No companies found"}), 404

        company_list = []
        for company in companies:
            company_list.append({
                "company_id": company.company_id,
                "company_name": company.company_name,
                "company_Address": company.company_Address,
                "company_phone": company.company_phone,
                "GSTNumber": company.GSTNumber,
                "Vendor_id": company.Vendor_id,
                "created_at": company.created_at,
                "updated_at": company.updated_at
            })

        return jsonify({
            "success": True,
            "data": company_list
        }), 200
    finally:
        session.close()
        
        
@company_print.route("/update/company/<int:company_id>",methods=["PUT"])
def update_company(company_id):
    session=SessionLocal()
    try:
        data=request.get_json()
        company=session.query(companies_bvc).filter_by(company_id=company_id).first()
        if not company:
            return jsonify({"error": "Company not found"}), 404
        company.company_id=data.get("company_id",company.company_id)
        company.company_name=data.get("company_name", company.company_name)
        company.company_Address=data.get("company_Address",company.company_Address)
        company.company_phone=data.get("company_phone",company.company_phone)
        company.GSTNumber=data.get("GSTNumber",company.GSTNumber)
        company.Vendor_id=data.get("Vendor_id",company.Vendor_id)
        
        session.commit()
        return jsonify({
           "success":True,
            "message":"Updated Successfully"
            }),200
    finally:
        session.close()

@company_print.route("/company/delete/<int:company_id>", methods=["DELETE"])
def delete_company(company_id):
    session = SessionLocal()
    try:
        company = session.query(companies_bvc).filter_by(company_id=company_id).first()
        if not company:
            return jsonify({"error": "Company not found"}), 404

        session.delete(company)
        session.commit()
        return jsonify({
            "success": True,
            "message": "Company deleted successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to delete company",
            "details": str(e)
        }), 500
    finally:
        session.close()    