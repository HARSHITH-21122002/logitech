# services/pine_labs_service.py

import requests
import logging

# Set up a basic logger to see the output from the service
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PineLabsService:
    """
    A service to interact with the Pine Labs Cloud Integration API.
    An instance of this class is designed to handle a single transaction flow.
    """

    def __init__(self, merchant_id, security_token, client_id, store_id, user_id):
        """
        Initializes the PineLabsService with required credentials.
        """
        # --- Configuration ---
        self.MERCHANT_ID = merchant_id
        self.SECURITY_TOKEN = security_token
        self.CLIENT_ID = client_id
        self.STORE_ID = store_id
        self.USER_ID = user_id
        
        # Use the Production URL. Change if you need the UAT (testing) environment.
        self.PINE_LABS_URL = "https://www.plutuscloudservice.in:8201/API/CloudBasedIntegration/V1"

        # --- Transaction State (managed per instance) ---
        self.transaction_id = None      # This is the TransactionLogId needed for refunds
        self.pl_txn_ref_id = None       # This is the PlutusTransactionReferenceID
        self.pl_payment_status = -1
        self.transaction_data = None

    def _post_request(self, endpoint, payload):
        """
        A private helper to send POST requests to the Pine Labs API.
        """
        url = f"{self.PINE_LABS_URL}/{endpoint}"
        headers = {
            "User-Agent": "BvcVmApp", # As used in the C# code
            "Content-Type": "application/json"
        }
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()  # Raises an exception for 4xx/5xx errors

            if not response.text:
                logger.error("Received Empty response from Pine Labs.")
                return {"status": "EmptyResponse"}

            return response.json()
        except requests.exceptions.HTTPError as http_err:
            logger.error(f"HTTP error occurred: {http_err} - {response.text}")
            return {"status": "HTTPError", "HTTPStatusCode": response.status_code, "detail": response.text}
        except requests.exceptions.RequestException as req_err:
            logger.error(f"Request error occurred: {req_err}")
            return {"status": "ServiceUnavailable"}
        except Exception as e:
            logger.error(f"An unexpected error occurred: {e}")
            return {"status": "ISE"}

    def _make_txn_request_base_json(self, payment_type):
        """
        Creates the base JSON payload for initiating a transaction (charge, void, refund).
        """
        allowed_payment_mode = "10" if payment_type == "UPI" else "1"

        txn_request = {
            "MerchantID": self.MERCHANT_ID,
            "SecurityToken": self.SECURITY_TOKEN,
            "ClientId": self.CLIENT_ID,
            "StoreId": self.STORE_ID,
            "UserID": self.USER_ID,
            "SequenceNumber": "1",
            "AutoCancelDurationInMinutes": "3",
            "AllowedPaymentMode": allowed_payment_mode
        }

        if payment_type == "UPI":
            txn_request["BankCode"] = "2"

        return txn_request

    def _get_base_json(self):
        """
        Creates the base JSON for status checks and cancellations.
        """
        return {
            "MerchantID": self.MERCHANT_ID,
            "SecurityToken": self.SECURITY_TOKEN,
            "ClientId": self.CLIENT_ID,
            "StoreId": self.STORE_ID,
            "TakeToHomeScreen": True,
            "ConfirmationRequired": True
        }

    def charge_txn(self, order_number, order_total, payment_type):
        """
        Initiates a payment charge for a given order.
        Returns the Pine Labs Transaction Reference ID if successful, otherwise None.
        """
        payload = self._make_txn_request_base_json(payment_type)
        payload["TransactionNumber"] = str(order_number)
        payload["Amount"] = int(order_total * 100)  # Amount in paisa

        logger.info(f"Initiating charge for Txn: {order_number} with amount: {payload['Amount']} paisa")
        response = self._post_request("UploadBilledTransaction", payload)

        if response.get("ResponseCode") == 0 and response.get("ResponseMessage", "").lower() == "approved":
            self.pl_txn_ref_id = response.get("PlutusTransactionReferenceID")
            logger.info(f"Transaction Approved. Reference ID: {self.pl_txn_ref_id}")
            return self.pl_txn_ref_id
        
        logger.warning(f"Transaction not approved. Response: {response}")
        return None

    def get_txn_status(self, ref_id):
        """
        Gets the status of a transaction using its reference ID.
        Crucially, it also extracts and stores the 'TransactionLogId' for potential refunds.
        Returns the response code (-1 on error).
        """
        payload = self._get_base_json()
        payload["PlutusTransactionReferenceID"] = ref_id
        
        response = self._post_request("GetCloudBasedTxnStatus", payload)
        
        self.pl_payment_status = response.get("ResponseCode", -1)
        self.transaction_data = response.get("TransactionData", [])

        if self.transaction_data:
            for item in self.transaction_data:
                if item.get("Tag") == "TransactionLogId":
                    self.transaction_id = item.get("Value")
                    logger.info(f"Found TransactionLogId for refund: {self.transaction_id}")
                    break
        
        logger.info(f"Transaction status: {self.pl_payment_status}, RefId: {ref_id}")
        return self.pl_payment_status

    def cancel_txn(self, txn_ref_id):
        """
        Forcibly cancels a pending transaction.
        """
        payload = self._get_base_json()
        payload["PlutusTransactionReferenceID"] = txn_ref_id
        logger.info(f"Attempting to cancel transaction with RefId: {txn_ref_id}")
        response = self._post_request("CancelTransactionForced", payload)
        
        response_code = response.get("ResponseCode", -1)
        self.pl_payment_status = response_code
        logger.info(f"Cancel transaction response code: {response_code} for RefId: {txn_ref_id}")
        return response_code

    def refund_card_txn(self, order_number, balance, payment_type):
        """
        Processes a refund for a previously completed transaction.
        NOTE: This requires the 'transaction_id' from the original transaction's status check.
        """
        if not self.transaction_id:
            logger.error(f"Cannot process refund for order {order_number}: TransactionLogId is missing. "
                         "Ensure get_txn_status was called for the original transaction.")
            return -1

        payload = self._make_txn_request_base_json(payment_type)
        payload["TransactionNumber"] = str(order_number)
        payload["Amount"] = int(balance * 100)
        payload["TransactionId"] = self.transaction_id # This is the TransactionLogId from get_txn_status
        payload["TxnType"] = "3"  # Refund transaction type

        logger.info(f"Refunding transaction for order: {order_number} with TransactionLogId: {self.transaction_id}")
        response = self._post_request("UploadBilledTransaction", payload)
        response_code = response.get("ResponseCode", -1)

        if response_code == 0:
            logger.info(f"Refund for order {order_number} processed successfully.")
        else:
            logger.warning(f"Failed to process refund for order {order_number}. Response: {response}")
            
        return response_code