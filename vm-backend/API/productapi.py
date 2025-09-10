from flask import Flask,jsonify,Blueprint,request
from models.models import products_bvc
from app.database import engine,session,SessionLocal
from config import img_file_to_base64
import uuid
import os
import base64


product_print=Blueprint('productapi',__name__)

@product_print.route("/product/create", methods=["POST"])
def create_product():
    session = SessionLocal()
    try:
        data = request.get_json()

        # Directly accept the base64 string if it's present
        image_base64 = data.get("image_path", None)

        # Calculate price with GST added
        base_price = float(data["price"])
        gst_rate = float(data["GST"])
        price_with_gst = base_price + (base_price * gst_rate / 100)

        # Update the price in the data dictionary
        data["price"] = round(price_with_gst, 2)  # round to 2 decimal places

        new_setting = products_bvc(
            categories_id=data.get("categories_id"),
            product_name=data["product_name"],
            image_path=image_base64,
            price=data["price"],
            GST=data["GST"],
            is_stocked=data.get("is_stocked", False),
            stock=data.get("stock", 0),
            Vendor_id=data.get("Vendor_id")
        )

        session.add(new_setting)
        session.commit()

        return jsonify({
            "success": True,
            "message": "Product Created successfully"
        }), 200

    except Exception as e:
        return jsonify({"error": f"{str(e)}"}), 500
    
@product_print.route("/product/update/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    session = SessionLocal()
    try:
        data = request.get_json()

        # Ensure Vendor_id is present in the data
        if not product_id:
            return jsonify({"error": "Product is required", "success":False}), 400

        # Fetch product using Vendor_id (replace with proper product_id or another identifier if needed)
        products = session.query(products_bvc).filter_by(product_id=product_id).first()

        if not products:
            return jsonify({"message": "Product not found", "success":False}), 404

        # Optional image_path handling
        if "image_path" in data:
            products.image_path = data["image_path"]

        # Update other fields
        products.categories_id = data.get("categories_id", products.categories_id)
        products.product_name = data.get("product_name", products.product_name)
        products.price = data.get("price", products.price)
        products.GST = data.get("GST", products.GST)
        products.is_stocked = data.get("is_stocked", products.is_stocked)
        products.stock = data.get("stock", products.stock)

        session.commit()

        return jsonify({
            "success": True,
            "message": "Product updated successfully."
        }), 200

    except Exception as e:
        print("Update error:", e)
        return jsonify({"error": str(e), "success":False}), 500

    finally:
        session.close()
            
@product_print.route("/products", methods=["GET"])
def getall_products():
    session = SessionLocal()
    try:
       Vendor_id= request.args.get("Vendor_id")

       query = session.query(products_bvc)
       
       if Vendor_id:
          query = query.filter(products_bvc.Vendor_id == Vendor_id)

       result = query.all()

       product_list = []

       for p in result:
            product_list.append({
                "product_id": p.product_id,
                "product_name": p.product_name,
                "price": p.price,
                "gst": p.GST,
                "image_path": p.image_path,
                "CREATED_AT": p.created_at,
                "UPDATED_AT": p.updated_at
            })

       return jsonify({"success": True, "message": "Product data retrived successfully.", "data": product_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
    
        
@product_print.route("/products/detail", methods=["GET"])  # Get all product details
def get_all_products():
    session = SessionLocal()
    try:
        products = session.query(products_bvc).all()

        if not products:
            return jsonify({"message": "No products found"}), 404

        product_list = []
        for product in products:
            product_list.append({
                "product_id": product.product_id,
                "categories_id": product.categories_id,
                "product_name": product.product_name,
                "image_path": product.image_path,
                "price": product.price,
                "GST": product.GST,
                "is_stocked": product.is_stocked,
                "stock": product.stock,
                "Vendor_id": product.Vendor_id,
                "updated_at": product.updated_at,
            })

        return jsonify({
            "success": True,
            "data": product_list,
            "message": "All products fetched successfully"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()   
         
@product_print.route("/product/clear", methods=["DELETE"])
def delete_products():
    session = SessionLocal()
    try:
        deleted_count = session.query(products_bvc).delete(synchronize_session=False)
        session.commit()
        return jsonify({"message": f"Successfully deleted {deleted_count} products"}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()    
           
# -------------------- DELETE --------------------
@product_print.route("/product/delete/<int:product_id>", methods=["DELETE"])
def delete_all_categories(product_id):
    session = SessionLocal()
    try:
        if not product_id:
            return jsonify({"error": "Product is required","success":False}), 400

        product = session.query(products_bvc).filter_by(product_id=product_id).first()

        if not product:
            return jsonify({"message": "Product not found", "success":False}), 404
        
        session.delete(product)
        session.commit()

        return jsonify({"success": True, "message": "Product deleted successfully"}), 200

    except Exception as e:
        print("Delete all error:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

