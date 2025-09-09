from flask import Flask,request,jsonify,Blueprint
from pine_labs_services import PineLabsService
import os
import time
import logging 


pinelabs_bp=Blueprint("pine_labs_api",__name__)


MERCHANT_ID = os.environ.get("PINE_LABS_MERCHANT_ID", "803024")
SECURITY_TOKEN = os.environ.get("PINE_LABS_SECURITY_TOKEN", "015946c5-9e82-416c-825c-abc1e2fa2fcc")
CLIENT_ID = os.environ.get("PINE_LABS_CLIENT_ID", "3673294")
STORE_ID = os.environ.get("PINE_LABS_STORE_ID", "1366881")
USER_ID = os.environ.get("PINE_LABS_USER_ID", "Bvc24")

@pinelabs_bp.route('/payment/start', methods=['POST'])
def start_payment():
    """
    Receives a request from the frontend to initiate a payment.
    It triggers the physical Pine Labs machine and returns a reference ID.
    This endpoint is designed to respond very quickly.
    """
    try:
        # 1. Check if the server is properly configured with credentials.
        if not all([MERCHANT_ID, SECURITY_TOKEN, CLIENT_ID, STORE_ID, USER_ID]):
            logging.error("SERVER CONFIG ERROR: Pine Labs environment variables are not set.")
            return jsonify({"status": "failed", "message": "Payment system is not configured."}), 503

        # 2. Validate the incoming data from the frontend.
        data = request.get_json()
        if not data:
            return jsonify({"status": "failed", "message": "Request must be JSON"}), 400
        
        order_number = data.get('order_number')
        order_total_str = data.get('order_total')
        payment_type = data.get('payment_type', 'Card')

        if not all([order_number, order_total_str is not None]):
            return jsonify({"status": "failed", "message": "Missing order_number or order_total"}), 400
        
        order_total = float(order_total_str)

        # 3. Use your PineLabsService class to start the transaction.
        logging.info(f"Received request to start payment for order: {order_number}")
        pine_labs = PineLabsService(MERCHANT_ID, SECURITY_TOKEN, CLIENT_ID, STORE_ID, USER_ID)
        ref_id = pine_labs.charge_txn(order_number, order_total, payment_type)

        # 4. Respond to the frontend.
        if ref_id:
            # Success! The machine has been triggered.
            return jsonify({"status": "pending", "reference_id": ref_id})
        else:
            # The Pine Labs terminal rejected the request (e.g., it's busy).
            return jsonify({"status": "failed", "message": "Payment terminal rejected the request."}), 502

    except Exception as e:
        logging.error(f"An unhandled error occurred in /payment/start: {e}", exc_info=True)
        return jsonify({"status": "failed", "message": "An internal server error occurred."}), 500


@pinelabs_bp.route('/payment/status/<ref_id>', methods=['GET'])
def get_payment_status(ref_id):
    """
    The frontend calls this endpoint repeatedly (polls) to check the status 
    of a transaction that has already been started.
    """
    try:
        # 1. Check server configuration.
        if not all([MERCHANT_ID, SECURITY_TOKEN, CLIENT_ID, STORE_ID, USER_ID]):
            return jsonify({"status": "failed", "message": "Payment system is not configured."}), 503

        if not ref_id:
            return jsonify({"status": "failed", "message": "No reference ID provided."}), 400

        # 2. Use your PineLabsService to get the status.
        logging.info(f"Received status check for reference ID: {ref_id}")
        pine_labs = PineLabsService(MERCHANT_ID, SECURITY_TOKEN, CLIENT_ID, STORE_ID, USER_ID)
        status_code = pine_labs.get_txn_status(ref_id)
        
        # 3. Translate Pine Labs' numeric code into a simple status for the frontend.
        if status_code == 0:
            final_status = "success"
        elif status_code in [1, 2, 9999]:
            final_status = "failed"
        else:
            final_status = "pending" # For "In Progress", etc.

        # 4. Respond to the frontend.
        return jsonify({
            "status": final_status,
            "reference_id": ref_id,
            "transaction_log_id": pine_labs.transaction_id # This is needed for refunds
        })

    except Exception as e:
        logging.error(f"An unhandled error occurred in /payment/status: {e}", exc_info=True)
        return jsonify({"status": "failed", "message": "An internal server error occurred."}), 500


@pinelabs_bp.route("/payment/refund", methods=["POST"])
def refund_payment():
    """
    Handles requests to process a refund for a completed transaction.
    """
    try:
        data = request.get_json()
        order_number = data.get('order_number')
        refund_amount = float(data.get('refund_amount'))
        payment_type = data.get('payment_type', 'Card')
        original_transaction_log_id = data.get('transaction_log_id')

        if not all([order_number, refund_amount, original_transaction_log_id]):
            return jsonify({"error": "Missing required fields for refund."}), 400

        pine_labs = PineLabsService(MERCHANT_ID, SECURITY_TOKEN, CLIENT_ID, STORE_ID, USER_ID)
        
        # The service needs the TransactionLogId to process the refund.
        pine_labs.transaction_id = original_transaction_log_id
        status_code = pine_labs.refund_card_txn(order_number, refund_amount, payment_type)

        if status_code == 0:
            return jsonify({"status": "success", "message": "Refund processed successfully."})
        else:
            return jsonify({"status": "failed", "message": f"Refund failed with code {status_code}."}), 500
            
    except Exception as e:
        logging.error(f"An unhandled error occurred in /payment/refund: {e}", exc_info=True)
        return jsonify({"status": "failed", "message": "An internal server error occurred."}), 500
    
@pinelabs_bp.route('/payment/cancel', methods=['POST'])
def cancel_payment():
    """
    Receives a request from the frontend to cancel a pending transaction.
    """
    try:
        data = request.get_json()
        ref_id = data.get('reference_id')

        if not ref_id:
            return jsonify({"status": "failed", "message": "No reference ID provided for cancellation."}), 400

        logging.info(f"CANCEL request for reference ID: {ref_id}")
        
        # Check for credentials just in case
        if not all([MERCHANT_ID, SECURITY_TOKEN, CLIENT_ID, STORE_ID, USER_ID]):
            return jsonify({"status": "failed", "message": "Payment system is not configured."}), 503

        pine_labs = PineLabsService(MERCHANT_ID, SECURITY_TOKEN, CLIENT_ID, STORE_ID, USER_ID)
        status_code = pine_labs.cancel_txn(ref_id)

        if status_code == 0:
            return jsonify({"status": "success", "message": "Transaction cancelled successfully."})
        else:
            # It might fail if the transaction was already completed, which is okay.
            return jsonify({"status": "failed", "message": f"Could not cancel transaction (code: {status_code}). It may have already completed or failed."})

    except Exception as e:
        logging.error(f"An unhandled error occurred in /payment/cancel: {e}", exc_info=True)
        return jsonify({"status": "failed", "message": "An internal server error occurred."}), 500
        

        