import uuid
from datetime import datetime
from app.database import engine
from sqlalchemy import (Boolean, Column, DateTime, Float, ForeignKey, Integer, String, func)
from sqlalchemy.dialects.mysql import MEDIUMTEXT
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.types import TypeDecorator

Base = declarative_base()

class user_bvc(Base):
     __tablename__="UserLogin"
     
     id=Column(Integer,primary_key=True, autoincrement=True)
     username=Column(String(100),unique=True,nullable=False)
     email=Column(String(100),unique=True,nullable=False)
     password_hash=Column(String(225),nullable=False)
     role=Column(String(20),nullable=False)
     created_at=Column(DateTime, nullable=False, default=datetime.utcnow)
     Vendor_id=Column(Integer,ForeignKey("Vendors.Vendor_id"),nullable=False)
     company_id=Column(Integer,ForeignKey("Companies.company_id"),nullable=False)
     
     vendors=relationship("vendors_bvc",back_populates="user")
     company=relationship("companies_bvc",back_populates="users")

class category_bvc(Base):
    __tablename__="Categories"
    
    categories_id=Column(Integer, primary_key=True, autoincrement=True)
    Vendor_id = Column(Integer, ForeignKey("Vendors.Vendor_id"), nullable=False)
    company_id=Column(Integer,ForeignKey("Companies.company_id"),nullable=False)
    Name=Column(String(20),nullable=False)
    imagepath=Column(MEDIUMTEXT,nullable=True)
    created_on=Column(DateTime,nullable=False,default=datetime.utcnow)
    updated_on=Column(DateTime,nullable=False,default=datetime.utcnow, onupdate=datetime.utcnow)
    
    vendor_info=relationship("vendors_bvc",back_populates="category_info")
    product_category_info=relationship("products_bvc",back_populates="category_info", cascade="all, delete-orphan", passive_deletes=True)
    category_company_info=relationship("companies_bvc",back_populates="company_info_category")
    
class vendors_bvc(Base):
    __tablename__ = "Vendors"
    Vendor_id = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(String(100), nullable=False)
    shortname = Column(String(100), nullable=False)
    Mail=Column(String(100),unique=True,nullable=False)
    CreatedOn = Column(DateTime, nullable=False, default=datetime.utcnow)
    IsActive = Column(Integer, nullable=False, default=1)
    

    # A Vendor can now have multiple companies. This is the primary relationship.
    companies = relationship("companies_bvc", back_populates="vendor")  
    product_info = relationship("products_bvc", back_populates="vendor_info")  
    category_info = relationship("category_bvc", back_populates="vendor_info")  
    user=relationship("user_bvc",back_populates="vendors")
    admin=relationship("adminuser_bvc",back_populates="vendors_id")
    account_info=relationship("RFID",back_populates="vendors_id")
    vendor_merchants = relationship("merchant_bvc", back_populates="vendor_info")#harshiths
    # vendor_orderdetail_info=relationship("ordersdetails_bvc",back_populates="orderdetail_vendor")


class companies_bvc(Base):
    __tablename__ = "Companies"
    company_id = Column(Integer, autoincrement=True, primary_key=True)
    Vendor_id = Column(Integer, ForeignKey("Vendors.Vendor_id"), nullable=False)
    company_name = Column(String(50), nullable=False)
    company_Address = Column(String(100), nullable=False)
    company_phone = Column(String(10), nullable=False, unique=True)
    GSTNumber = Column(String(100), unique=True)
    created_at=Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at=Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    

    # A Company belongs to one Vendor
    vendor = relationship("vendors_bvc", back_populates="companies")
    users=relationship("user_bvc",back_populates="company")
    #- ADDED: Relationships to all child tables that now link to a Company.
    # This Company can own multiple machines, payment settings, merchants, etc.
    company_machines = relationship("machines_bvc", back_populates="company_info")
    company_payments = relationship("payment_bvc", back_populates="company_info")
    company_paydetails = relationship("paymentdetails_bvc", back_populates="company_info")
    company_orders = relationship("ordersdetails_bvc", back_populates="company_info")
    company_refills = relationship("refill_bvc", back_populates="company_info")
    company_stock_info=relationship("stock_bvc",back_populates="company_info")
    company_orderitem_info=relationship("orderitem_bvc",back_populates="company_info")
    company_operator_info=relationship("operatorlogin_bvc",back_populates="operator_company")
    company_info_category=relationship("category_bvc",back_populates="category_company_info")
    

class machines_bvc(Base):
    __tablename__ = "Machines"
    Machine_id = Column(Integer, autoincrement=True, primary_key=True)
    Machine_Guid = Column(String(100), unique=True, nullable=False)
    AppType = Column(String(100), nullable=False)
    Machinenumber = Column(Integer, nullable=False)
    Name = Column(String(100), nullable=False)
    Mac = Column(String(100), nullable=False, unique=True)
    Location = Column(String(100), nullable=False)
    Status = Column(String(10), nullable=False, default="online")
    Connection_id = Column(String(100), nullable=True)
    PgSettingId = Column(Integer,ForeignKey("MerchantSetting.Merchants_id"), nullable=False)
    Createdon = Column(DateTime, nullable=False, default=datetime.utcnow)
    Updatedon = Column(DateTime, nullable=False, default=datetime.utcnow)
    IsActive = Column(Integer, nullable=False, default=1)
    

    company_id = Column(Integer, ForeignKey("Companies.company_id"), nullable=False)
    Vendor_id = Column(Integer, ForeignKey("Vendors.Vendor_id"), nullable=False)
    guid_info = relationship("payment_bvc", back_populates="payment_info")
    paydetail_guid_info = relationship("paymentdetails_bvc", back_populates="payment_guid")
    order_guid_info = relationship("ordersdetails_bvc", back_populates="order_guid")
    refill_guid_info = relationship("refill_bvc", back_populates="refill_guid")
    company_info = relationship("companies_bvc", back_populates="company_machines")
    stock_info=relationship("stock_bvc",back_populates="machine_guid_info")
    video_info=relationship("Video",back_populates="machine_video")
    video_info=relationship("Video",back_populates="machine_video")
    report_info=relationship("ReportData",back_populates="machine_info")
    machine_info_refillog=relationship("RefillStock",back_populates="refill_log_info_machine")
    machine_info_clearlog=relationship("ClearStockLog",back_populates="clear_stock_info")
    machine_infos=relationship("merchant_bvc",back_populates="merchant_setting_info")

    
class payment_bvc(Base):
    __tablename__ = "Paymentsettings"
    payment_id = Column(Integer, autoincrement=True, primary_key=True)
    Guid = Column(String(100), ForeignKey("Machines.Machine_Guid"), nullable=False)
    Cash = Column(Integer, nullable=False, default=0)
    Upi = Column(Integer, nullable=False, default=0)
    Account = Column(Integer, nullable=False, default=0)
    Card = Column(Integer, nullable=False, default=0)
    Counter = Column(Integer, nullable=False, default=0)
    
    #- CHANGED: Foreign key now points to Companies instead of Vendors.
    company_id = Column(Integer, ForeignKey("Companies.company_id"), nullable=False)

    payment_info = relationship("machines_bvc", back_populates="guid_info")
    #- CHANGED: Relationship now points to companies_bvc.
    company_info = relationship("companies_bvc", back_populates="company_payments")


class merchant_bvc(Base):
    __tablename__ = "MerchantSetting"
    Merchants_id = Column(Integer,autoincrement=True,primary_key=True)
    Gatewayname = Column(String(100), nullable=False)
    ProviderID = Column(String(100), nullable=False)
    ProviderName = Column(String(100), nullable=False)
    MerchantId = Column(String(100), nullable=False)
    MerchantName = Column(String(100), nullable=False)
    MerchantVPA = Column(String(100), nullable=False)
    MerchantKey = Column(String(100), nullable=False,default=lambda:f"{uuid.uuid4()}")
    MCC = Column(Integer, nullable=False)
    KeyIndex = Column(Integer, nullable=False)
    BaseUrl = Column(String(100), nullable=False)
    PublicKeyPath = Column(String(100), nullable=True)
    PrivateKeyPath = Column(String(100), nullable=True)

    #- CHANGED: Foreign key now points to Companies instead of Vendors.
    Vendor_id = Column(Integer, ForeignKey("Vendors.Vendor_id"), nullable=False)

    #- CHANGED: Relationship now points to companies_bvc.
    vendor_info = relationship("vendors_bvc", back_populates="vendor_merchants")
    merchant_setting_info=relationship("machines_bvc",back_populates="machine_infos")
     
    


class paymentdetails_bvc(Base):
    __tablename__ = "PaymentDetails"

    Payment_id = Column(Integer, primary_key=True, autoincrement=True)
    OrderNumber = Column(String(50), ForeignKey("OrderDetails.OrderNumber"), nullable=False)
    TransactionId = Column(String(100), unique=True, nullable=False)
    PaymentMethod = Column(String(50), nullable=False)
    PaymentProvider = Column(String(100), nullable=False)
    Amount = Column(Float, nullable=False)
    User_id = Column(String(100), nullable=False)
    Machine_Guid = Column(String(100), ForeignKey("Machines.Machine_Guid"), nullable=False)
    IsPaid=Column(Boolean, default=False)
    IsRefunded = Column(Boolean, default=False)
    RefundedAmount=Column(Float,default=0)
    IsSucceed = Column(Boolean, default=False)
    RefundReason = Column(String(255), nullable=True)
    RefundReference = Column(String(100), nullable=True)
    RefundStatus = Column(String(50), nullable=True)
    UpdatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    company_id = Column(Integer, ForeignKey("Companies.company_id"), nullable=False)

    payment_guid = relationship("machines_bvc", back_populates="paydetail_guid_info")
    company_info = relationship("companies_bvc", back_populates="company_paydetails")
    # report_payment_info=relationship("ReportData",back_populates="payment_report")
    # report_refund_info =relationship("ReportData",back_populates="report_refundedamount")

    # ✅ Relationship back to order
    order_info = relationship(
        "ordersdetails_bvc",
        back_populates="payments",
        foreign_keys=[OrderNumber]
    )

class orderitem_bvc(Base):
    __tablename__="OrderItems"
    
    id=Column(String(100),primary_key=True,default=lambda:f"it-{uuid.uuid4()}")
    orderid=Column(String(100),nullable=False,default=lambda:f"or-{uuid.uuid4()}")
    Product_id=Column(Integer ,ForeignKey("Products.product_id"),nullable=False)
    ProductName=Column(String(100),nullable=False)
    Rate=Column(Integer,nullable=False)
    GST=Column(Float,nullable=False)
    Price=Column(Integer,nullable=False)
    Vend_Quantity=Column(Integer,nullable=False)
    updatedon=Column(DateTime,default=datetime.utcnow)
    company_id=Column(Integer,ForeignKey("Companies.company_id"),nullable=False)
    
    company_info=relationship("companies_bvc",back_populates="company_orderitem_info")
    order_item=relationship("products_bvc",back_populates="product_order_item")
   
     
    
    
class ordersdetails_bvc(Base):
    __tablename__ = "OrderDetails"

    Order_id = Column(String(100), primary_key=True, default=lambda: f"OR-{uuid.uuid4()}")
    OrderNumber = Column(String(50), unique=True, nullable=False)
    OrderDate = Column(DateTime, default=datetime.utcnow)
    Total = Column(Float, nullable=False)
    Machine_Guid = Column(String(100), ForeignKey("Machines.Machine_Guid"), nullable=False)
    DeliveryType = Column(String(50), nullable=True)
    PaymentType = Column(String(50), nullable=True)
    IsPaid = Column(Boolean, default=False)
    IsRefunded = Column(Boolean, default=False)
    RefundedAmount = Column(Float, default=0.0)

    # ✅ Plain column, not a foreign key
    PaymentId = Column(Integer, nullable=True)

    company_id = Column(Integer, ForeignKey("Companies.company_id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("Vendors.Vendor_id"), nullable=False)
    

    # Relationships
    order_guid = relationship("machines_bvc", back_populates="order_guid_info")
    company_info = relationship("companies_bvc", back_populates="company_orders")
    # report_details_info=relationship("ReportData",back_populates="report_orderdetails")

    # ✅ One-to-many: one order → multiple payments (optional)
    payments = relationship(
        "paymentdetails_bvc",
        back_populates="order_info",
        foreign_keys="paymentdetails_bvc.OrderNumber"
    )

  
class spiral_bvc(Base):
    __tablename__ = "SpiralMotors"
    id = Column(Integer, primary_key=True)
    motor_position = Column(Integer, unique=True, nullable=False)
    row_number = Column(Integer, nullable=False)
    column_number = Column(Integer, nullable=False)
    is_enabled = Column(Boolean, default=False)
    motor_address = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    motor_number = relationship("refill_bvc", back_populates="reill_motor")
    stock_number=relationship("stock_bvc",back_populates="spiral_info")

    def __repr__(self):
        return f"<SpiralMotorCard(position={self.motor_position}, enabled={self.is_enabled})>"

    def to_dict(self):
        return {
            'id': self.id,
            'motor_position': self.motor_position,
            'row_number': self.row_number,
            'column_number': self.column_number,
            'is_enabled': self.is_enabled,
            'motor_address': self.motor_address,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'product_count': 0
        }


class MediumText(TypeDecorator):
    impl = MEDIUMTEXT


class products_bvc(Base):
    __tablename__ = "Products"
    product_id = Column(Integer, primary_key=True, nullable=False, autoincrement=True)
    categories_id = Column(Integer, ForeignKey("Categories.categories_id", ondelete="CASCADE"),nullable=False)
    product_name = Column(String(100), nullable=False)
    image_path = Column(MediumText, nullable=False)
    price = Column(Float, nullable=False)
    GST = Column(Float, nullable=False)
    is_stocked = Column(Boolean, default=True)
    stock = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    Vendor_id=Column(Integer,ForeignKey("Vendors.Vendor_id"),nullable=False)

    product_id_refill = relationship("refill_bvc", back_populates="product_relation")
    category_info=relationship("category_bvc",back_populates="product_category_info")
    vendor_info=relationship("vendors_bvc",back_populates="product_info")
    stock_product_id=relationship("stock_bvc",back_populates="product_id_stock")
    product_order_item=relationship("orderitem_bvc",back_populates="order_item")
    product_info_refilling=relationship("RefillStock",back_populates="refill_log_info_product")
    product_info_clearlog=relationship("ClearStockLog",back_populates="clear_stock_info_product")

class refill_bvc(Base):
    __tablename__ = "refill"
    refill_id = Column(Integer, primary_key=True, autoincrement=True)
    Machine_Guid = Column(String(100), ForeignKey("Machines.Machine_Guid"), nullable=False)
    Motor_number = Column(Integer, ForeignKey("SpiralMotors.motor_position"), nullable=False)
    Product_id = Column(Integer, ForeignKey("Products.product_id"), nullable=False)
    ProductName = Column(String(100),nullable=False)
    Quantity = Column(Integer, nullable=False)
    Refilled_on = Column(DateTime, default=datetime.utcnow)
    company_id = Column(Integer, ForeignKey("Companies.company_id"), nullable=False)

    #- CHANGED: Relationship now points to companies_bvc.
    company_info = relationship("companies_bvc", back_populates="company_refills")
    # stock_Quantity=relationship("stock_bvc",back_populates="Quantity_stock")
    product_relation = relationship("products_bvc", back_populates="product_id_refill")
    refill_guid = relationship("machines_bvc", back_populates="refill_guid_info")
    reill_motor = relationship("spiral_bvc", back_populates="motor_number")
    
    
    
class stock_bvc(Base):
    __tablename__="StockReport"
    
    id=Column(Integer, primary_key=True, autoincrement=True)
    Machine_Guid=Column(String(100),ForeignKey("Machines.Machine_Guid"),nullable=False)
    Motor_number=Column(Integer,ForeignKey("SpiralMotors.motor_position"),nullable=False)
    Product_id=Column(Integer ,ForeignKey("Products.product_id"),nullable=False)
    stock=Column(Integer,nullable=False)
    Quantity=Column(Integer,nullable=False)
    company_id=Column(Integer,ForeignKey("Companies.company_id"),nullable=False)
    
    machine_guid_info =relationship("machines_bvc",back_populates="stock_info")
    
    spiral_info=relationship("spiral_bvc",back_populates="stock_number")
    product_id_stock=relationship("products_bvc",back_populates="stock_product_id")
    company_info=relationship("companies_bvc",back_populates="company_stock_info")
    
class adminuser_bvc(Base):
    __tablename__="AdminUser"
    
    id=Column(Integer,primary_key=True,autoincrement=True)
    Vendor_id=Column(Integer,ForeignKey("Vendors.Vendor_id"),nullable=False)
    userRole=Column(String(100),nullable=False)
    userAdminName=Column(String(20),nullable=False)
    user_password=Column(String(225),unique=True,nullable=False)
    CREATED_AT=Column(DateTime, default=datetime.utcnow)
    UPDATED_AT=Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    vendors_id=relationship("vendors_bvc",back_populates="admin") 


class Video(Base):
    __tablename__ = 'videos'

    video_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    video_base64 = Column(MEDIUMTEXT, nullable=False) 
    filename = Column(String(255), nullable=False)
    upload_time = Column(DateTime, default=datetime.utcnow)
    Machine_Guid = Column(String(100), ForeignKey('Machines.Machine_Guid'), nullable=False)
    machine_video=relationship("machines_bvc",back_populates="video_info")
    
class operatorlogin_bvc(Base):
    
    __tablename__ ="OperatorLogin"
    
    id=Column(Integer,primary_key=True,autoincrement=True)
    username=Column(String(20),nullable=False,unique=True)
    password=Column(String(225),nullable=False)
    company_id=Column(Integer,ForeignKey("Companies.company_id"),nullable=False)
    
    operator_company=relationship("companies_bvc",back_populates="company_operator_info")

class ReportData(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    Vendor_id = Column(Integer, nullable=False)
    Machine_Guid = Column(String(64),ForeignKey("Machines.Machine_Guid"), nullable=False)
    Name=Column(String(50),nullable=False)
    product_name = Column(String(64), nullable=False)
    quantity = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    order_number=Column(String(100),nullable=False)
    transaction_id=Column(String(100),nullable=False)
    is_paid = Column(Boolean ,default=True)
    is_refunded = Column(Boolean, default=False)
    refunded_amount = Column(Float, default=0.0) 
    transaction_time = Column(DateTime, default=datetime.utcnow)
    payment_type = Column(String(20),nullable=False)
    
    machine_info=relationship("machines_bvc",back_populates="report_info")


class RFID(Base):
    __tablename__ = "Accountregister"
    
    id=Column(Integer,primary_key=True,autoincrement=True)
    Vendor_id=Column(Integer,ForeignKey("Vendors.Vendor_id"),nullable=False)
    RFID=Column(String(100),nullable=False,unique=True)
    Name=Column(String(20),nullable=False)
    image_path = Column(MediumText, nullable=True)
    User_No=Column(String(20),nullable=False,unique=True)
    balance=Column(Float,default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow,)

    vendors_id=relationship("vendors_bvc",back_populates="account_info") 
    

class AccountData(Base):
    __tablename__ = "usertransactions"
    
    transaction_id = Column(Integer, primary_key=True, autoincrement=True)
    rfid = Column(String(100), nullable=False) 
    user_name = Column(String(100), nullable=True)  
    amount = Column(Float, nullable=False)  
    balance_after = Column(Float, nullable=False)  
    order_id = Column(String(50), nullable=True)  
    product_name = Column(String(100), nullable=True) 
    quantity = Column(Integer, nullable=True) 
    transaction_date = Column(DateTime, default=datetime.utcnow)
    refunded_amount = Column(Float, default=0.0)
    is_refunded = Column(Boolean, default=False)
    is_paid = Column(Boolean, default=False)

    def __repr__(self):
        return f"<RFIDTransaction rfid={self.rfid} amount={self.amount}>"
    
class RefillStock(Base):
    __tablename__ = 'refill_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_guid = Column(String(255),ForeignKey('Machines.Machine_Guid'),nullable=False)
    motor_number = Column(Integer, nullable=False)
    product_id = Column(Integer, ForeignKey('Products.product_id'), nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity_added = Column(Integer, nullable=False)
    stock_before_refill = Column(Integer, nullable=False)
    stock_after_refill = Column(Integer, nullable=False)
    refill_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    
    refill_log_info_machine=relationship("machines_bvc",back_populates="machine_info_refillog")
    refill_log_info_product=relationship("products_bvc",back_populates="product_info_refilling")
    
class ClearStockLog(Base):
    __tablename__ = "clear_stock_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_guid = Column(String(255),ForeignKey('Machines.Machine_Guid'),nullable=False)
    
    motor_number = Column(Integer, nullable=False)
    product_id = Column(Integer,ForeignKey('Products.product_id'),nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity_cleared = Column(Integer, nullable=False)
    clear_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    clear_type = Column(String(20), nullable=False)
    
    clear_stock_info=relationship("machines_bvc",back_populates="machine_info_clearlog")
    clear_stock_info_product=relationship("products_bvc",back_populates="product_info_clearlog")

Base.metadata.create_all(bind=engine)


