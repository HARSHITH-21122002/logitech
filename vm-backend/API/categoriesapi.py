from flask import Flask, jsonify, request, Blueprint
from flask_jwt_extended import jwt_required
from models.models import category_bvc,products_bvc
from app.database import SessionLocal
from config import img_file_to_base64
import os

categories_print = Blueprint("categoriesapi", __name__)

# -------------------- CREATE --------------------
@categories_print.route("/create/category", methods=["POST"])
def post_categories():
    session = SessionLocal()
    try:
        data = request.get_json()

        Vendor_id = data.get("Vendor_id")
        company_id=data.get("company_id")
        name = data.get("Name")
        image_base64 = data.get("imagepath")  # Expected as base64 string from frontend

        # Validation
        if not Vendor_id:
            return jsonify({"message": "Vendor is required"}), 400

        if not name:
            return jsonify({"message": "Category name is required"}), 400
        
        if not image_base64:
            return jsonify({"message": "Category image is required"}), 400

        # Check if category with the same name already exists
        if session.query(category_bvc).filter_by(Name=name, Vendor_id = Vendor_id).first():
            return jsonify({"message": "Category with this name already exists"}), 400

        # Create new category record
        new_category = category_bvc(
            Vendor_id=Vendor_id,
            company_id=company_id,
            Name=name,
            imagepath=image_base64
        )

        session.add(new_category)
        session.commit()

        return jsonify({
            "success": True,
            "message": "Category registered successfully"
        }), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
# -------------------- READ --------------------
@categories_print.route("/categories", methods=["GET"])
def get_categories():
    session = SessionLocal()
    try:
        Vendor_id = request.args.get("Vendor_id")

        query = session.query(category_bvc)
         
        if Vendor_id:
            query = query.filter(category_bvc.Vendor_id == Vendor_id)

        result = query.all()

        category_data =[
            {
                "categories_id": c.categories_id,
                "Vendor_id":c.Vendor_id,
                "Name": c.Name,
                "imagepath": f"data:image/jpeg;base64,{c.imagepath}" if c.imagepath else None,
                "created_on": c.created_on,
                "updated_on": c.updated_on
            }
          for c in result
        ]

        return jsonify({
            "success": True,
            "message": "Category data retrieved successfully.",
            "data": category_data
        }), 200
    finally:
        session.close()
        
@categories_print.route("/get/category",methods=["GET"])
def getcompanyproducts():
    session=SessionLocal()
    try:
        company_id=request.args.get("company_id")
        
        query = session.query(category_bvc)
        
        if company_id:
            query=query.filter(category_bvc.company_id == company_id)
            
        result=query.all()
        category_data =[
            {
                "categories_id": c.categories_id,
                "Vendor_id":c.Vendor_id,
                "Name": c.Name,
                "imagepath": f"data:image/jpeg;base64,{c.imagepath}" if c.imagepath else None,
                "created_on": c.created_on,
                "updated_on": c.updated_on
            }
          for c in result
        ]

        return jsonify({
            "success": True,
            "message": "Category data retrieved successfully.",
            "data": category_data
        }), 200
    
    finally:
        session.close()
        
        

# -------------------- UPDATE --------------------
@categories_print.route("/categories/update/<int:categories_id>", methods=["PUT"])
def update_categories(categories_id):
    session = SessionLocal()
    try:
        data = request.get_json()

        if not categories_id:
            return jsonify({"error": "categories_id is required", "success":False}), 400

        category = session.query(category_bvc).filter_by(categories_id=categories_id).first()

        if not category:
            return jsonify({"message": "Category not found", "success":False}), 404

        if "image_path" in data:
            category.imagepath = data["image_path"]

        if "Name" in data:
            category.Name = data["Name"]

        session.commit()
        return jsonify({"message": "Successfully updated", "success":True}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

# -------------------- DELETE --------------------
@categories_print.route("/categories/delete/<int:categories_id>", methods=["DELETE"])
def delete_all_categories(categories_id):
    session = SessionLocal()
    try:
        if not categories_id:
            return jsonify({"error": "categories_id is required", "success":False}), 400

        category = session.query(category_bvc).filter_by(categories_id=categories_id).first()

        if not category:
            return jsonify({"message": "Category not found", "success":False}), 404
        
        session.delete(category)
        session.commit()

        return jsonify({"success": True, "message": "All categories deleted successfully"}), 200

    except Exception as e:
        print("Delete all error:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()