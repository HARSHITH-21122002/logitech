from flask import Flask,jsonify,request,Blueprint
from models.models import ReportData,ordersdetails_bvc,machines_bvc
from app.database import engine,session,SessionLocal
from sqlalchemy import func
import datetime
import pytz, datetime
IST = pytz.timezone("Asia/Kolkata")

report_bp = Blueprint("reportApi",__name__)


@report_bp.route("/storereport", methods=["POST"])
def store_report():
    session = SessionLocal()
    try:
        data = request.get_json()

        required_fields = [
            "Vendor_id", "Machine_Guid", "product_name", "quantity",
            "amount", "order_number", "transaction_id", "is_paid",
            "payment_type"
        ]
        missing = [f for f in required_fields if f not in data]
        if missing:
            return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}"}), 400
        
        machine = session.query(machines_bvc).filter_by(Machine_Guid=data["Machine_Guid"]).first()
        if not machine:
            return jsonify({"success": False, "error": "Invalid Machine_Guid"}), 404

        # Suppose your machines_bvc model has "Machine_Name" column
        machine_name = machine.Name 
        
        
        report = ReportData(
            Vendor_id=data["Vendor_id"],
            Machine_Guid=data["Machine_Guid"],
            Name=machine.Name,
            product_name=data["product_name"],
            quantity=int(data["quantity"]),
            amount=float(data["amount"]),
            order_number=data["order_number"],
            transaction_id=data["transaction_id"],
            is_paid=bool(data["is_paid"]),
            is_refunded=False,                     # always false at creation
            refunded_amount=0.0,                   # always 0 at creation
            transaction_time=datetime.datetime.now(IST),
            payment_type=data["payment_type"]
        )

        session.add(report)
        session.commit()

        return jsonify({
            "success": True,
            "message": "Report stored successfully",
            "data": {
                "id": report.id,
                "Vendor_id": report.Vendor_id,
                "Machine_Guid": report.Machine_Guid,
                "Name": report.Name,
                "product_name": report.product_name,
                "quantity": report.quantity,
                "amount": report.amount,
                "order_number": report.order_number,
                "transaction_id": report.transaction_id,
                "is_paid": report.is_paid,
                "is_refunded": report.is_refunded,
                "refunded_amount": report.refunded_amount,
                "transaction_time": report.transaction_time.strftime("%Y-%m-%d %H:%M:%S"),
                "payment_type": report.payment_type
            }
        }), 201

    except Exception as e:
        session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        session.close()
   
@report_bp.route("/update-refund/<string:orderNumber>", methods=["PUT"])
def update_order_refund(orderNumber):
    session = SessionLocal()
    try:
        data = request.get_json()
        is_refunded_int = data.get("is_refunded") 
        refunded_amount = data.get("refunded_amount")
        product_details = data.get("product_details", [])  # new field from frontend

        if is_refunded_int is None or refunded_amount is None:
            return jsonify({"message": "Missing 'is_refunded' or 'refunded_amount' in payload."}), 400

        is_refunded_bool = bool(is_refunded_int)
        refunded_amount_float = float(refunded_amount)

        report_rows = session.query(ReportData).filter_by(order_number=orderNumber).all()
        if not report_rows:
            return jsonify({"message": f"No report rows found for order_number '{orderNumber}'"}), 404

        # Update overall order info across rows
        for row in report_rows:
            row.is_refunded = is_refunded_bool

        # Update per-product refund if provided
        if product_details:
            for item in product_details:
                product_name = item.get("product_name")
                refunded_amt = float(item.get("refunded_amount", 0))
                status = item.get("status", "Refunded")
                is_paid = bool(item.get("is_paid", 1))
                product_row = next((r for r in report_rows if r.product_name == product_name), None)
                if product_row:
                    product_row.refunded_amount = refunded_amt
                    product_row.is_paid = is_paid
                    if status == "Vended":
                        product_row.is_refunded = False
                else:
                
                    continue
        else:
            report_rows[0].refunded_amount = refunded_amount_float

        session.commit()

        return jsonify({
            "success": True,
            "message": f"Refund updated successfully for order {orderNumber}",
            "order_number": orderNumber,
            "total_refunded_amount": refunded_amount_float,
            "rows_updated": len(report_rows)
        }), 200

    except Exception as e:
        session.rollback()
        return jsonify({"message": f"An internal server error occurred: {e}"}), 500
    finally:
        session.close()


    

@report_bp.route("/get/report", methods=["GET"])
def getreport():
    session = SessionLocal()
    try:
        # --- Get query params ---
        from_date_str = request.args.get("from_date") or request.args.get("from")
        to_date_str   = request.args.get("to_date")   or request.args.get("to")
        Machine_Guid  = request.args.get("Machine_Guid")

        page  = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 50))

        filters = []

        # --- Parse dates ---
        def parse_date(s):
            for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
                try:
                    return datetime.datetime.strptime(s, fmt).date()
                except ValueError:
                    pass
            raise ValueError("Bad date format; use YYYY-MM-DD or DD/MM/YYYY")

        IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
        UTC = datetime.timezone.utc

        if from_date_str and to_date_str:
            from_d = parse_date(from_date_str)
            to_d   = parse_date(to_date_str)

            # Build IST day window [00:00, next day 00:00)
            from_ist = datetime.datetime.combine(from_d, datetime.time.min, tzinfo=IST)
            to_ist_next = datetime.datetime.combine(to_d + datetime.timedelta(days=1), datetime.time.min, tzinfo=IST)

            # If your DB stores IST already (current case):
            from_naive = from_ist.replace(tzinfo=None)
            to_naive   = to_ist_next.replace(tzinfo=None)

            filters.append(ReportData.transaction_time >= from_naive)
            filters.append(ReportData.transaction_time <  to_naive)

        if Machine_Guid:
            filters.append(ReportData.Machine_Guid == Machine_Guid)

        # --- Query ---
        query = session.query(ReportData).filter(*filters)
        total_count = query.count()

        paginated = query.order_by(ReportData.transaction_time.desc()) \
                         .offset((page - 1) * limit).limit(limit).all()

        # --- Helper to format datetime for response ---
        def format_transaction_time(dt):
            # DB stores IST naive datetime
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        result = [{
            "id": r.id,
            "Name": r.Name,
            "product_name": r.product_name,
            "quantity": r.quantity,
            "amount": r.amount,
            "is_paid": r.is_paid,
            "is_refunded": r.is_refunded,
            "refunded_amount": r.refunded_amount,
            "transaction_time": format_transaction_time(r.transaction_time),
            "payment_type": r.payment_type,
        } for r in paginated]

        # --- Totals ---
        total_sales = session.query(func.sum(ReportData.amount)).filter(*filters).scalar() or 0.0
        total_paid = session.query(func.sum(ReportData.amount)).filter(*filters, ReportData.is_paid == True).scalar() or 0.0
        total_refunded = session.query(func.sum(ReportData.refunded_amount)).filter(*filters, ReportData.is_refunded == True).scalar() or 0.0

        return jsonify({
            "success": True,
            "message": "Report data retrieved successfully",
            "data": result,
            "total_sales": round(total_sales, 2),
            "total_paid": round(total_paid, 2),
            "total_refunded": round(total_refunded, 2),
            "page": page,
            "limit": limit,
            "total_count": total_count,
            "from_date": from_date_str,
            "to_date": to_date_str
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        session.close()

        

@report_bp.route("/get/total/vendor/machine/report", methods=["GET"])
def get_all__machine_report():
    session = SessionLocal()
    try:
        Vendor_id = request.args.get("Vendor_id")

        query = session.query(ReportData)

        if Vendor_id:
            query = query.filter(ReportData.Vendor_id == Vendor_id)

        results = query.all()

        report_data = [{
            "id": r.id,
            "Vendor_id": r.Vendor_id,
            "Machine_Guid": r.Machine_Guid,
            "product_name": r.product_name,
            "quantity": r.quantity,
            "amount": r.amount,
            "is_paid": r.is_paid,
            "is_refunded": r.is_refunded,
            "refunded_amount": r.refunded_amount,
            "transaction_time": r.transaction_time.strftime("%Y-%m-%d %H:%M:%S"),
            "payment_type": r.payment_type
        } for r in results]


        return jsonify({
            "success":True,
            "message" : "Report data retrived successfully",
            "data": report_data,
        })

    except Exception as e:
        return jsonify({"error": str(e), "success":False}), 500
    finally:
        session.close()