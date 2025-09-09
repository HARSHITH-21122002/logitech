from flask import Flask,jsonify,request,Blueprint
from models.models import orderitem_bvc
from config import generate_order_number
from app.database import  engine,session,SessionLocal

items_print=Blueprint("orderitemapi",__name__)

@items_print.route("/orderitem",methods=["POST"])
def orderitem():
    session=SessionLocal()
    try:
        data=request.get_json()
            
        required_fields=["Product_id","ProductName","Rate","GST","Price","Vend_Quantity","company_id"]
        missing = [field for field in required_fields if data.get(field) is None]
        if missing:
            return jsonify({"error":f"missing required fields:{', '.join(missing)}"})
            
        new_item=orderitem_bvc(           
        Product_id=data.get("Product_id"),
        ProductName=data["ProductName"],
        Rate=data["Rate"],
        GST=data["GST"],
        Price=data["Price"],
        Vend_Quantity=data["Vend_Quantity"],
        company_id=data.get("company_id")
        )  
        session.add(new_item)
        session.commit()
        return jsonify({"message":"orderitems create sucessfully"}),200
    except Exception as e:
        return jsonify({"error":str(e)})
    finally:
        session.close()
        
@items_print.route("/orderitem",methods=["GET"])
def orderitem_all():
    session=SessionLocal()
    try:
        items=session.query(orderitem_bvc).all()
        if not items:
            return jsonify({"error":"items not found"}),404
        result=[]
        
        for item in items:
            result.append({
                "orderdid":item.orderdid,
                "Product_id":item.Product_id,
                "ProductName":item.ProductName,
                "Rate":item.Rate,
                "GST":item.GST,
                "Price":item.Price,
                "Vend_Quantity":item.Vend_Quantity,
                "company_id":item.company_id
                
                })
        return jsonify(result)
    finally:
        session.close()

@items_print.route("/orderitems/<int:filterid>",methods=["GET"])
def orderitem_get(filterid):
    session=SessionLocal()
    try:
        
        items=session.query(orderitem_bvc).filter_by(company_id=filterid).first()
        if not items:
            return jsonify({"error":"items not found"}),404
        
        return jsonify({
            "orderdid":items.orderdid,
                "Product_id":items.Product_id,
                "ProductName":items.ProductName,
                "Rate":items.Rate,
                "GST":items.GST,
                "Price":items.Price,
                "Vend_Quantity":items.Vend_Quantity,
            })
    finally:
        session.close()

@items_print.route("/orderitem/<int:filterid>", methods=["PUT"])
def orderitem_update(filterid):
    session = SessionLocal()
    try:
        data = request.get_json()
        items = session.query(orderitem_bvc).filter_by(company_id=filterid).first()
        
        if not items:
            return jsonify({"error": "items not found"}), 404
        
        items.ProductName = data.get("ProductName", items.ProductName)
        items.Rate = data.get("Rate", items.Rate)
        items.GST = data.get("GST", items.GST)
        items.Price = data.get("Price", items.Price)
        items.Vend_Quantity = data.get("Vend_Quantity", items.Vend_Quantity)
        items.company_id = data.get("company_id", items.company_id)
        
        session.commit()

        return jsonify({
            "message": "stock updated successfully",
            "data": {
                "orderdid": items.orderdid,
                "Product_id": items.Product_id,
                "ProductName": items.ProductName,
                "Rate": items.Rate,
                "GST": items.GST,
                "Price": items.Price,
                "Vend_Quantity": items.Vend_Quantity,
                "company_id": items.company_id
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
        
@items_print.route("/orderitem/<int:filterid>",methods=["DELETE"])
def orderitem_del(filterid):
    try:
        session=SessionLocal()
        items=session.query(orderitem_bvc).filter_by(company_id=filterid).all()
        
        if not items:
            return jsonify({"error":"items not found"}),404
        
        for item in items:
            session.delete(item)
            session.commit()
            
        return jsonify ({"message":"items  deleted"}),200
    
    except Exception as e:
        return jsonify({"error":str(e)})
    
    finally:
        session.close()
        
        
 
        
        
      
       
    
         
