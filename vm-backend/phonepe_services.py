# import json
# import base64
# import hashlib
# import asyncio
# import aiohttp
# from aiohttp import TCPConnector
# from typing import Optional, Dict, Any
# from dataclasses import dataclass, asdict
# from enum import Enum
# import logging
# from flask import Flask, Blueprint, request, jsonify
# from functools import wraps
# import os

# # --- MODIFIED: Import your database session and model ---
# # These imports connect this file to your project's database and models.
# from app.database import SessionLocal
# from models.models import merchant_bvc

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # --- Enums and Data Classes (No changes needed) ---
# class PaymentStatusCode(Enum):
#     PENDING = "PENDING"
#     SUCCESS = "SUCCESS"
#     FAILED = "FAILED"

# @dataclass
# class PaymentGatewayConfigDto:
#     merchant_id: str
#     merchant_key: str
#     key_index: str
#     provider_id: str
#     base_url: str
#     merchant_name: str

# @dataclass
# class UPICreateResponse:
#     success: bool
#     upi_string: Optional[str] = None
#     transaction_id: Optional[str] = None
#     display_name: Optional[str] = None
#     message: Optional[str] = None

# # ... Other DTOs like UPIStatusResponse, UPIRefundResponse, etc., remain the same ...
# @dataclass
# class UPIStatusResponse:
#     success: bool
#     status: str
#     transaction_id: str
#     message: str

# @dataclass
# class UPIRefundResponse:
#     success: bool
#     refund_id: str
#     status: Optional[str] = None
#     refund_ref_id: Optional[str] = None

# @dataclass
# class PhonePeInitQrRequest:
#     merchantId: str
#     transactionId: str
#     storeId: str
#     amount: int
#     expiresIn: int

# @dataclass
# class PhonepeAPIRequest:
#     request: str

# @dataclass
# class PhonePeInitQrResponse:
#     success: bool
#     code: str
#     data: Dict[str, Any]
#     @classmethod
#     def from_dict(cls, data: Dict[str, Any]):
#         return cls(success=data.get('success', False), code=data.get('code', ''), data=data.get('data', {}))

# @dataclass
# class PhonePePaymentStatus:
#     code: str
#     data: Dict[str, Any]
#     @classmethod
#     def from_dict(cls, data: Dict[str, Any]):
#         return cls(code=data.get('code', ''), data=data.get('data', {}))

# @dataclass
# class PhonePeRefundAPIRequest:
#     merchantId: str
#     providerRefId: str
#     transactionId: str
#     merchantRefId: str
#     originalTransactionId: str
#     amount: int
#     callbackUrl: str

# @dataclass
# class PhonePeRefundAPIResponse:
#     success: bool
#     data: Dict[str, Any]
#     @classmethod
#     def from_dict(cls, data: Dict[str, Any]):
#         return cls(success=data.get('success', False), data=data.get('data', {}))

# # --- PhonePe Service Class (No changes needed internally) ---
# class PhonepeService:
#     def __init__(self, config: PaymentGatewayConfigDto, base_callback_url: str, logger: Optional[logging.Logger] = None):
#         self.config = config
#         self.base_callback_url = base_callback_url
#         self.logger = logger or logging.getLogger(__name__)
#         self.gateway = "Phonepe"
    
#     async def create_qr_async(self, order_number: str, amount: float, machine_id: str) -> UPICreateResponse:
#         try:
#             init_qr = PhonePeInitQrRequest(
#                 merchantId=self.config.merchant_id,
#                 transactionId=order_number,
#                 storeId=machine_id,
#                 amount=int(amount * 100),
#                 expiresIn=178
#             )
#             url_endpoint = "/v3/qr/init"
#             json_str = json.dumps(asdict(init_qr))
#             base64_json = self._convert_string_to_base64(json_str)
#             json_suffix_string = f"{url_endpoint}{self.config.merchant_key}"
#             checksum = self._generate_sha256_checksum_from_base64_json(base64_json, json_suffix_string)
#             checksum = f"{checksum}###{self.config.key_index}"
#             init_request = PhonepeAPIRequest(base64_json)
#             url = f"{self.config.base_url}{url_endpoint}"
#             headers = {
#                 "X-VERIFY": checksum,
#                 "X-PROVIDER-ID": self.config.provider_id,
#                 "X-CALLBACK-URL": self._get_callback_url(),
#                 "X-CALL-MODE": "POST",
#                 "Content-Type": "application/json"
#             }
#             logger.info(f"PhonePe Request Body: {json_str}")
#             logger.info(f"PhonePe X-VERIFY Header: {checksum}")

#             connector = TCPConnector(ssl=False)
#             async with aiohttp.ClientSession(connector=connector) as session:
#                 async with session.post(url, json=asdict(init_request), headers=headers) as response:
#                     response_text = await response.text()
            
#             self.logger.info(f"PhonePe QR Init Response: {response_text}")
#             if response.status != 200:
#                 return UPICreateResponse(success=False, message=f"Unable to generate QR. Status: {response.status}, Body: {response_text}")
            
#             init_response = PhonePeInitQrResponse.from_dict(json.loads(response_text))
#             if not (init_response.success and init_response.code == "SUCCESS"):
#                 return UPICreateResponse(success=False, message=f"Unable to generate QR. Details: {init_response.code}")
            
#             return UPICreateResponse(
#                 success=True, upi_string=init_response.data.get('qrString'),
#                 transaction_id=init_response.data.get('transactionId'),
#                 display_name=self.config.merchant_name
#             )
#         except Exception as e:
#             self.logger.error(f"Error creating QR: {str(e)}", exc_info=True)
#             return UPICreateResponse(success=False, message="An unexpected error occurred while creating QR.")

#     def _get_callback_url(self) -> str:
#         # NOTE: You might want to move this to your database config in the future.
#         base_callback_url = os.getenv('BASE_CALLBACK_URL', 'https://mercury-uat.phonepe.com/enterprise-sandbox')
#         return f"{base_callback_url}/api/payments/gateway/phonepe"

#     def _convert_string_to_base64(self, input_string: str) -> str:
#         return base64.b64encode(input_string.encode('utf-8')).decode('utf-8')

#     def _generate_sha256_checksum_from_base64_json(self, base64_json_string: str, json_suffix_string: str) -> str:
#         checksum_string = base64_json_string + json_suffix_string
#         return hashlib.sha256(checksum_string.encode('utf-8')).hexdigest()

# # --- Async Decorator (No changes needed) ---
# def async_route(f):
#     @wraps(f)
#     def wrapper(*args, **kwargs):
#         loop = asyncio.new_event_loop()
#         asyncio.set_event_loop(loop)
#         try:
#             return loop.run_until_complete(f(*args, **kwargs))
#         finally:
#             loop.close()
#     return wrapper

# # --- Blueprint Definition ---
# phonepe_bp = Blueprint('paymentqr', __name__)

# # --- NEW: Helper function to get service instance with DB config ---
# def get_phonepe_service_instance():
#     """Fetches config from DB and returns an initialized PhonepeService instance."""
#     session = SessionLocal()
#     try:
#         # NOTE: This fetches the FIRST active PhonePe config.
#         # You may need to add more filtering later (e.g., by company_id) if you have multiple merchants.
#         db_config = session.query(merchant_bvc).filter(merchant_bvc.Gatewayname == "Phonepe").first()

#         if not db_config:
#             logger.error("No PhonePe merchant configuration found in the database.")
#             return None, "PhonePe merchant configuration not found."

#         # Create the DTO from the database model
#         gateway_config = PaymentGatewayConfigDto(
#             merchant_id=db_config.MerchantId,
#             merchant_key=db_config.MerchantKey,
#             key_index=str(db_config.KeyIndex),  # API requires key_index as a string
#             provider_id=db_config.ProviderID,
#             base_url=db_config.BaseUrl,
#             merchant_name=db_config.MerchantName
#         )
        
#         # NOTE: The base callback URL is still from an environment variable for flexibility.
#         base_callback_url = os.getenv('BASE_CALLBACK_URL', 'https://mercury-uat.phonepe.com/enterprise-sandbox')
#         return PhonepeService(gateway_config, base_callback_url, logger), None
#     finally:
#         session.close()

# # --- REFFACTORED: Blueprint Routes now use the helper function ---
# @phonepe_bp.route('/create-qr', methods=['POST'])
# @async_route
# async def create_qr():
#     try:
#         # Step 1: Get the service instance with config from the database
#         phonepe_service, error_msg = get_phonepe_service_instance()
#         if error_msg:
#             return jsonify({'success': False, 'message': error_msg}), 404

#         # Step 2: Process the request from the client
#         data = request.get_json()
#         required_fields = ['order_number', 'amount', 'machine_id']
#         for field in required_fields:
#             if field not in data:
#                 return jsonify({'error': f'Missing required field: {field}'}), 400
        
#         # Step 3: Call the service method with the correct, dynamic configuration
#         response = await phonepe_service.create_qr_async(
#             order_number=data['order_number'],
#             amount=float(data['amount']),
#             machine_id=data['machine_id']
#         )
#         return jsonify(asdict(response))
        
#     except ValueError:
#         return jsonify({'error': 'Invalid amount format'}), 400
#     except Exception as e:
#         logger.error(f"Error in create_qr endpoint: {str(e)}", exc_info=True)
#         return jsonify({'error': 'Internal server error'}), 500

# # The other routes would be refactored similarly
# @phonepe_bp.route('/status/<order_number>', methods=['GET'])
# @async_route
# async def check_status(order_number):
#     # You would add the same logic here: get_phonepe_service_instance(), then call status_async
#     return jsonify({"message": "Status endpoint not yet implemented with dynamic config."}), 501

# @phonepe_bp.route('/refund', methods=['POST'])
# @async_route
# async def process_refund():
#     # You would add the same logic here: get_phonepe_service_instance(), then call refund_async
#     return jsonify({"message": "Refund endpoint not yet implemented with dynamic config."}), 501

# @phonepe_bp.route('/gateway/phonepe', methods=['POST'])
# def phonepe_callback():
#     data = request.get_json()
#     logger.info(f"PhonePe callback received: {data}")
#     return jsonify({'status': 'success', 'message': 'Callback received'})


# import json
# import base64
# import hashlib
# import asyncio
# import aiohttp
# from aiohttp import TCPConnector
# from typing import Optional, Dict, Any
# from dataclasses import dataclass, asdict
# from enum import Enum
# import logging
# from flask import Flask, Blueprint, request, jsonify
# from functools import wraps
# import os

# # Import your database session and model
# from app.database import SessionLocal
# from models.models import merchant_bvc

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # --- Enums and Data Classes (Unchanged) ---
# class PaymentStatusCode(Enum):
#     PENDING = "PENDING"
#     SUCCESS = "SUCCESS"
#     FAILED = "FAILED"

# @dataclass
# class PaymentGatewayConfigDto:
#     merchant_id: str
#     merchant_key: str
#     key_index: str
#     provider_id: str
#     base_url: str
#     merchant_name: str

# # ... other dataclasses ...
# @dataclass
# class UPICreateResponse:
#     success: bool
#     upi_string: Optional[str] = None
#     transaction_id: Optional[str] = None
#     display_name: Optional[str] = None
#     message: Optional[str] = None
# @dataclass
# class UPIStatusResponse:
#     success: bool
#     status: str
#     transaction_id: str
#     message: str
# @dataclass
# class UPIRefundResponse:
#     success: bool
#     refund_id: str
#     status: Optional[str] = None
#     refund_ref_id: Optional[str] = None
# @dataclass
# class PhonePeInitQrRequest:
#     merchantId: str
#     transactionId: str
#     storeId: str
#     amount: int
#     expiresIn: int
# @dataclass
# class PhonepeAPIRequest:
#     request: str
# @dataclass
# class PhonePeInitQrResponse:
#     success: bool
#     code: str
#     data: Dict[str, Any]
#     @classmethod
#     def from_dict(cls, data: Dict[str, Any]):
#         return cls(success=data.get('success', False), code=data.get('code', ''), data=data.get('data', {}))
# @dataclass
# class PhonePePaymentStatus:
#     code: str
#     data: Dict[str, Any]
#     @classmethod
#     def from_dict(cls, data: Dict[str, Any]):
#         return cls(code=data.get('code', ''), data=data.get('data', {}))
# @dataclass
# class PhonePeRefundAPIRequest:
#     merchantId: str
#     providerRefId: str
#     transactionId: str
#     merchantRefId: str
#     originalTransactionId: str
#     amount: int
#     callbackUrl: str
# @dataclass
# class PhonePeRefundAPIResponse:
#     success: bool
#     data: Dict[str, Any]
#     @classmethod
#     def from_dict(cls, data: Dict[str, Any]):
#         return cls(success=data.get('success', False), data=data.get('data', {}))

# # --- PhonePe Service Class ---
# class PhonepeService:
#     def __init__(self, config: PaymentGatewayConfigDto, logger: Optional[logging.Logger] = None):
#         self.config = config
#         self.logger = logger or logging.getLogger(__name__)

#     async def create_qr_async(self, order_number: str, amount: float, machine_id: str) -> UPICreateResponse:
#         # NOTE: For testing, use a pre-registered store ID from PhonePe
#         # In production, ensure all your machine_ids are registered as storeIds.
#         # known_good_store_id = "YOUR_PRE_REGISTERED_STORE_ID" 
        
#         init_qr = PhonePeInitQrRequest(
#             merchantId=self.config.merchant_id,
#             transactionId=order_number,
#             storeId=machine_id, # Using the real machine_id. Ensure it is registered with PhonePe.
#             amount=int(amount * 100),
#             expiresIn=178
#         )
#         url_endpoint = "/v3/qr/init"
#         json_str = json.dumps(asdict(init_qr))
#         base64_json = self._convert_string_to_base64(json_str)
#         checksum = self._generate_checksum(base64_json, url_endpoint)
        
#         headers = { "X-VERIFY": checksum, "X-PROVIDER-ID": self.config.provider_id, "X-CALLBACK-URL": self._get_callback_url(), "X-CALL-MODE": "POST", "Content-Type": "application/json" }
#         url = f"{self.config.base_url}{url_endpoint}"
        
#         try:
#             connector = TCPConnector(ssl=False)
#             async with aiohttp.ClientSession(connector=connector) as session:
#                 async with session.post(url, json={"request": base64_json}, headers=headers) as response:
#                     response_text = await response.text()
#             self.logger.info(f"PhonePe QR Init Response: {response_text}")
#             if response.status != 200:
#                 return UPICreateResponse(success=False, message=f"Unable to generate QR. Status: {response.status}, Body: {response_text}")
#             init_response = PhonePeInitQrResponse.from_dict(json.loads(response_text))
#             if not (init_response.success and init_response.code == "SUCCESS"):
#                 return UPICreateResponse(success=False, message=init_response.data.get("message") or "UPI Intent generation failed.")
#             return UPICreateResponse(success=True, upi_string=init_response.data.get('qrString'), transaction_id=init_response.data.get('transactionId'), display_name=self.config.merchant_name)
#         except Exception as e:
#             self.logger.error(f"Error creating QR: {str(e)}", exc_info=True)
#             return UPICreateResponse(success=False, message="An unexpected error occurred while creating QR.")

#     async def status_async(self, order_number: str) -> UPIStatusResponse:
#         url_endpoint = f"/v3/transaction/{self.config.merchant_id}/{order_number}/status"
#         checksum = self._generate_checksum("", url_endpoint)
#         headers = { "X-VERIFY": checksum, "X-PROVIDER-ID": self.config.provider_id }
#         url = f"{self.config.base_url}{url_endpoint}"
        
#         try:
#             connector = TCPConnector(ssl=False)
#             async with aiohttp.ClientSession(connector=connector) as session:
#                 async with session.get(url, headers=headers) as response:
#                     response_text = await response.text()
            
#             self.logger.info(f"PhonePe Status Response for {order_number}: {response_text}")
#             payment_status = PhonePePaymentStatus.from_dict(json.loads(response_text))
#             status_mapping = { "PAYMENT_SUCCESS": PaymentStatusCode.SUCCESS.value, "PAYMENT_PENDING": PaymentStatusCode.PENDING.value }
#             status = status_mapping.get(payment_status.code, PaymentStatusCode.FAILED.value)
            
#             return UPIStatusResponse(success=True, status=status, transaction_id=payment_status.data.get('providerReferenceId', ''), message=payment_status.data.get('message', ''))
#         except Exception as e:
#             self.logger.error(f"Error checking status for {order_number}: {e}", exc_info=True)
#             return UPIStatusResponse(success=False, status=PaymentStatusCode.PENDING.value, message="Error checking status.", transaction_id=order_number)

#     # ... other helper methods ...
#     def _get_callback_url(self) -> str:
#         base_callback_url = os.getenv('BASE_CALLBACK_URL', 'https://mercury-uat.phonepe.com/enterprise-sandbox')
#         return f"{base_callback_url}/api/payments/gateway/phonepe"
#     def _convert_string_to_base64(self, input_string: str) -> str:
#         return base64.b64encode(input_string.encode('utf-8')).decode('utf-8')
#     def _generate_checksum(self, base64_payload: str, endpoint: str) -> str:
#         checksum_string = f"{base64_payload}{endpoint}{self.config.merchant_key}"
#         sha256_hash = hashlib.sha256(checksum_string.encode('utf-8')).hexdigest()
#         return f"{sha256_hash}###{self.config.key_index}"


# # --- Async Decorator ---
# def async_route(f):
#     @wraps(f)
#     def wrapper(*args, **kwargs):
#         loop = asyncio.new_event_loop()
#         asyncio.set_event_loop(loop)
#         try: return loop.run_until_complete(f(*args, **kwargs))
#         finally: loop.close()
#     return wrapper

# # --- Blueprint Definition ---
# phonepe_bp = Blueprint('paymentqr', __name__)

# # --- Helper function to get service instance with DB config ---
# def get_phonepe_service_instance():
#     session = SessionLocal()
#     try:
#         db_config = session.query(merchant_bvc).filter(merchant_bvc.Gatewayname == "Phonepe").first()
#         if not db_config:
#             logger.error("No PhonePe merchant configuration found in the database.")
#             return None, "PhonePe merchant configuration not found."
#         gateway_config = PaymentGatewayConfigDto(
#             merchant_id=db_config.MerchantId, merchant_key=db_config.MerchantKey,
#             key_index=str(db_config.KeyIndex), provider_id=db_config.ProviderID,
#             base_url=db_config.BaseUrl, merchant_name=db_config.MerchantName
#         )
#         return PhonepeService(gateway_config, logger), None
#     finally:
#         session.close()

# # --- Blueprint Routes ---

# @phonepe_bp.route('/create-qr', methods=['POST'])
# @async_route
# async def create_qr():
#     try:
#         phonepe_service, error_msg = get_phonepe_service_instance()
#         if error_msg: return jsonify({'success': False, 'message': error_msg}), 404
#         data = request.get_json()
#         required_fields = ['order_number', 'amount', 'machine_id']
#         for field in required_fields:
#             if field not in data: return jsonify({'error': f'Missing required field: {field}'}), 400
#         response = await phonepe_service.create_qr_async(
#             order_number=data['order_number'], 
#             amount=float(data['amount']), 
#             machine_id=data['machine_id']
#         )
#         return jsonify(asdict(response))
#     except ValueError: return jsonify({'error': 'Invalid amount format'}), 400
#     except Exception as e:
#         logger.error(f"Error in create_qr endpoint: {str(e)}", exc_info=True)
#         return jsonify({'error': 'Internal server error'}), 500

# @phonepe_bp.route('/status/<order_number>', methods=['GET'])
# @async_route
# async def check_status(order_number):
#     """Fully implemented status check endpoint."""
#     try:
#         phonepe_service, error_msg = get_phonepe_service_instance()
#         if error_msg:
#             return jsonify({'success': False, 'message': error_msg}), 404
        
#         response = await phonepe_service.status_async(order_number)
#         return jsonify(asdict(response))
#     except Exception as e:
#         logger.error(f"Error in check_status endpoint for {order_number}: {e}", exc_info=True)
#         return jsonify({'error': 'Internal server error'}), 500

# @phonepe_bp.route('/refund', methods=['POST'])
# @async_route
# async def process_refund():
#     """Placeholder for refund implementation."""
#     # You would implement this similarly to the other endpoints.
#     # 1. Get service instance.
#     # 2. Get data from request.json.
#     # 3. Call a new `refund_async` method in the service.
#     # 4. Return the result.
#     return jsonify({"message": "Refund endpoint not yet implemented."}), 501

# @phonepe_bp.route('/gateway/phonepe', methods=['POST'])
# def phonepe_callback():
#     data = request.get_json()
#     logger.info(f"PhonePe callback received: {data}")
#     return jsonify({'status': 'success', 'message': 'Callback received'})

import json
import base64
import hashlib
import asyncio
import aiohttp
import uuid
from aiohttp import TCPConnector
from typing import Optional, Dict, Any
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from flask import Blueprint, request, jsonify
from functools import wraps
import os

# Import your database session and model
from app.database import SessionLocal
from models.models import merchant_bvc,machines_bvc

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Enums ---
class PaymentStatusCode(Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

class RefundStatusCode(Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

# --- Data Classes ---

@dataclass
class PaymentGatewayConfigDto:
    merchant_id: str
    merchant_key: str
    key_index: str
    provider_id: str
    base_url: str
    merchant_name: str

@dataclass
class UPICreateResponse:
    success: bool
    upi_string: Optional[str] = None
    transaction_id: Optional[str] = None
    provider_transaction_id: Optional[str] = None
    display_name: Optional[str] = None
    message: Optional[str] = None

@dataclass
class UPIStatusResponse:
    # --- CORRECTED ORDER ---
    # Non-default arguments first
    success: bool
    status: str
    transaction_id: str
    message: str
    # Default arguments last
    provider_transaction_id: Optional[str] = None

@dataclass
class UPIRefundResponse:
    success: bool
    status: Optional[str] = None
    message: Optional[str] = None
    refund_id: Optional[str] = None
    provider_refund_id: Optional[str] = None

# --- PhonePe Specific Dataclasses ---

@dataclass
class PhonePeInitQrRequest:
    merchantId: str
    transactionId: str
    storeId: str
    amount: int
    expiresIn: int

@dataclass
class PhonepeAPIRequest:
    request: str

@dataclass
class PhonePeInitQrResponse:
    success: bool
    code: str
    data: Dict[str, Any]
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        return cls(success=data.get('success', False), code=data.get('code', ''), data=data.get('data', {}))

@dataclass
class PhonePePaymentStatus:
    code: str
    data: Dict[str, Any]
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        return cls(code=data.get('code', ''), data=data.get('data', {}))

@dataclass
class PhonePeRefundAPIRequest:
    merchantId: str
    originalTransactionId: str
    merchantTransactionId: str
    amount: int
    callbackUrl: str

@dataclass
class PhonePeRefundAPIResponse:
    success: bool
    code: str
    data: Dict[str, Any]
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        return cls(success=data.get('success', False), code=data.get('code', ''), data=data.get('data', {}))


# --- PhonePe Service Class ---
class PhonepeService:
    def __init__(self, config: PaymentGatewayConfigDto, logger: Optional[logging.Logger] = None):
        self.config = config
        self.logger = logger or logging.getLogger(__name__)

    async def create_qr_async(self, order_number: str, amount: float, machine_id: str) -> UPICreateResponse:
        init_qr = PhonePeInitQrRequest(
            merchantId=self.config.merchant_id,
            transactionId=order_number,
            storeId=machine_id,
            amount=int(amount * 100),
            expiresIn=178
        )
        url_endpoint = "/v3/qr/init"
        response = await self._make_post_request(url_endpoint, asdict(init_qr))
        if not response:
            return UPICreateResponse(success=False, message="API request failed.")
        
        init_response = PhonePeInitQrResponse.from_dict(response)
        if not (init_response.success and init_response.code == "SUCCESS"):
            return UPICreateResponse(success=False, message=init_response.data.get("message") or "UPI Intent generation failed.")
        
        polling_id = init_response.data.get('transactionId')
        return UPICreateResponse(
            success=True,
            upi_string=init_response.data.get('qrString'),
            transaction_id=polling_id,
            provider_transaction_id=polling_id,
            display_name=self.config.merchant_name
        )

    async def status_async(self, order_number: str) -> UPIStatusResponse:
        url_endpoint = f"/v3/transaction/{self.config.merchant_id}/{order_number}/status"
        response = await self._make_get_request(url_endpoint)
        if not response:
            return UPIStatusResponse(success=False, status=PaymentStatusCode.FAILED.value, transaction_id=order_number, message="API request failed.")

        payment_status = PhonePePaymentStatus.from_dict(response)
        status_mapping = { "PAYMENT_SUCCESS": PaymentStatusCode.SUCCESS.value, "PAYMENT_PENDING": PaymentStatusCode.PENDING.value }
        status = status_mapping.get(payment_status.code, PaymentStatusCode.FAILED.value)
        
        return UPIStatusResponse(
            success=True, status=status,
            transaction_id=order_number,
            provider_transaction_id=payment_status.data.get('providerReferenceId'),
            message=payment_status.data.get('message', '')
        )

    async def refund_async(self, original_transaction_id: str, refund_transaction_id: str, amount: float) -> UPIRefundResponse:
        refund_req = PhonePeRefundAPIRequest(
            merchantId=self.config.merchant_id,
            originalTransactionId=original_transaction_id,
            merchantTransactionId=refund_transaction_id,
            amount=int(amount * 100),
            callbackUrl=self._get_callback_url()
        )
        url_endpoint = "/v3/credit/backToSource"
        response = await self._make_post_request(url_endpoint, asdict(refund_req))
        if not response:
            return UPIRefundResponse(success=False, status=RefundStatusCode.FAILED.value, message="API request failed.")
        
        refund_response = PhonePeRefundAPIResponse.from_dict(response)
        status_mapping = {"SUCCESS": RefundStatusCode.SUCCESS.value, "PENDING": RefundStatusCode.PENDING.value}
        status = status_mapping.get(refund_response.code, RefundStatusCode.FAILED.value)

        return UPIRefundResponse(
            success=refund_response.success,
            status=status,
            message=refund_response.data.get("message"),
            refund_id=refund_transaction_id,
            provider_refund_id=refund_response.data.get("transactionId")
        )

    # --- Private Helper Methods ---
    async def _make_post_request(self, endpoint: str, payload_dict: Dict) -> Optional[Dict]:
        json_str = json.dumps(payload_dict)
        base64_json = self._convert_string_to_base64(json_str)
        checksum = self._generate_checksum(base64_json, endpoint)
        headers = { "X-VERIFY": checksum, "X-PROVIDER-ID": self.config.provider_id, "X-CALLBACK-URL": self._get_callback_url(), "X-CALL-MODE": "POST", "Content-Type": "application/json" }
        url = f"{self.config.base_url}{endpoint}"
        
        try:
            connector = TCPConnector(ssl=False)
            async with aiohttp.ClientSession(connector=connector) as session:
                async with session.post(url, json={"request": base64_json}, headers=headers) as response:
                    response_text = await response.text()
                    self.logger.info(f"PhonePe POST to {endpoint} Response: {response_text}")
                    if response.status >= 400: return None
                    return json.loads(response_text)
        except Exception as e:
            self.logger.error(f"Error making POST request to {endpoint}: {e}", exc_info=True)
            return None
    
    async def _make_get_request(self, endpoint: str) -> Optional[Dict]:
        checksum = self._generate_checksum("", endpoint)
        headers = { "X-VERIFY": checksum, "X-PROVIDER-ID": self.config.provider_id }
        url = f"{self.config.base_url}{endpoint}"
        try:
            connector = TCPConnector(ssl=False)
            async with aiohttp.ClientSession(connector=connector) as session:
                async with session.get(url, headers=headers) as response:
                    response_text = await response.text()
                    self.logger.info(f"PhonePe GET to {endpoint} Response: {response_text}")
                    if response.status >= 400: return None
                    return json.loads(response_text)
        except Exception as e:
            self.logger.error(f"Error making GET request to {endpoint}: {e}", exc_info=True)
            return None

    def _get_callback_url(self) -> str:
        base_callback_url = os.getenv('BASE_CALLBACK_URL', 'https://your-api-domain.com')
        return f"{base_callback_url}/api/payments/gateway/phonepe"

    def _convert_string_to_base64(self, input_string: str) -> str:
        return base64.b64encode(input_string.encode('utf-8')).decode('utf-8')

    def _generate_checksum(self, base64_payload: str, endpoint: str) -> str:
        checksum_string = f"{base64_payload}{endpoint}{self.config.merchant_key}"
        sha256_hash = hashlib.sha256(checksum_string.encode('utf-8')).hexdigest()
        return f"{sha256_hash}###{self.config.key_index}"

# --- Async Decorator ---
def async_route(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try: return loop.run_until_complete(f(*args, **kwargs))
        finally: loop.close()
    return wrapper

# --- Blueprint Definition ---
phonepe_bp = Blueprint('phonepe_services', __name__)

# --- Helper function to get service instance ---
def get_phonepe_service_instance(PgSettingId):
    session = SessionLocal()
    try:
        
        db_config = session.query(merchant_bvc).filter(merchant_bvc.Merchants_id == PgSettingId).first()
        if not db_config:
            logger.error("No PhonePe merchant configuration found.")
            return None, "PhonePe merchant configuration not found."
        gateway_config = PaymentGatewayConfigDto(
            merchant_id=db_config.MerchantId, merchant_key=db_config.MerchantKey,
            key_index=str(db_config.KeyIndex), provider_id=db_config.ProviderID,
            base_url=db_config.BaseUrl, merchant_name=db_config.MerchantName
        )
        return PhonepeService(gateway_config, logger), None
    finally:
        session.close()

# --- Blueprint Routes ---

@phonepe_bp.route('/create-qr', methods=['POST'])
@async_route
async def create_qr():
    try:
        data = request.get_json()

        required_fields = ['order_number', 'amount', 'machine_id', 'PgSettingId']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        phonepe_service, error_msg = get_phonepe_service_instance(data['PgSettingId'])
        if error_msg:
            return jsonify({'success': False, 'message': error_msg}), 404
        response = await phonepe_service.create_qr_async(
            order_number=data['order_number'],
            amount=float(data['amount']),
            machine_id=data['machine_id']
        )
        return jsonify(asdict(response))

    except Exception as e:
        logger.error(f"Error in create_qr endpoint: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500


@phonepe_bp.route('/status/<order_number>', methods=['GET'])
@async_route
async def check_status(order_number):
    try:
        PgSettingId = request.args.get("PgSettingId")  # ✅ take from query
        if not PgSettingId:
            return jsonify({"error": "Missing required query parameter: PgSettingId"}), 400

        phonepe_service, error_msg = get_phonepe_service_instance(PgSettingId)  # ✅ pass it here
        if error_msg:
            return jsonify({'success': False, 'message': error_msg}), 404

        response = await phonepe_service.status_async(order_number)
        return jsonify(asdict(response))
    except Exception as e:
        logger.error(f"Error in check_status for {order_number}: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@phonepe_bp.route('/refund', methods=['POST'])
@async_route
async def process_refund():
    session = SessionLocal()
    try:
        data = request.get_json() or {}
        pg_setting_id = data.get("PgSettingId") or request.args.get("PgSettingId")

        if not pg_setting_id:
            return jsonify({
                "success": False,
                "message": "PgSettingId is required to fetch merchant configuration"
            }), 400


        phonepe_service, error_msg = get_phonepe_service_instance(pg_setting_id)
        if error_msg:
            return jsonify({
                "success": False,
                "message": error_msg
            }), 404

        required_fields = ['originalTransactionId', 'amount']
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            return jsonify({
                "success": False,
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400

        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({"success": False, "message": "Amount must be greater than zero"}), 400
        except ValueError:
            return jsonify({"success": False, "message": "Invalid amount format"}), 400

        refund_transaction_id = f"REF{uuid.uuid4().hex[:20].upper()}"

        response = await phonepe_service.refund_async(
            original_transaction_id=data['originalTransactionId'],
            refund_transaction_id=refund_transaction_id,
            amount=amount
        )


        return jsonify({
            "success": True,
            "refundTransactionId": refund_transaction_id,
            "originalTransactionId": data['originalTransactionId'],
            "amount": amount,
            "phonepeResponse": asdict(response)
        }), 200

    except Exception as e:
        logger.error(f"Error in process_refund endpoint: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "message": "Internal server error",
            "details": str(e)
        }), 500
    finally:
            session.close()


@phonepe_bp.route('/gateway/phonepe', methods=['POST'])
def phonepe_callback():
    data = request.get_json()
    logger.info(f"PhonePe callback received: {data}")
    return jsonify({'status': 'success', 'message': 'Callback received'})