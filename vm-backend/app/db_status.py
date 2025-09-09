# db_setup.py
from app.database import engine, SessionLocal
from models.models import Base,vendors_bvc, companies_bvc, user_bvc,machines_bvc,merchant_bvc
import datetime
from datetime import datetime
import uuid


def setup_database():
    # Create all tables
    from api import bcrypt
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully")

    session = SessionLocal()
    try:
       #Insert Vendor
        existing_vendor = session.query(vendors_bvc).filter_by(Name="BVC").first()
        if not existing_vendor:
            default_vendor = vendors_bvc(
                Name="BVC",
                shortname="BVC",
                Mail ="ramkumarbvc24@gmail.com"
                
            )
            session.add(default_vendor)
            session.commit()
            print("Default Vendor inserted")
        else:
            default_vendor = existing_vendor
            print("Vendor already exists")

        # Insert company
        existing_company = session.query(companies_bvc).filter_by(company_name="Bharath Vending Corporation").first()
        if not existing_company:
            default_company = companies_bvc(
                Vendor_id = default_vendor.Vendor_id,
                company_name="Bharath Vending Corporation",
                company_Address="TNHB Colony, Indira Nagar, Civil Aerodrome Post, Coimbatore",
                company_phone="6380472367",
                GSTNumber="H7348h909"
            )
            session.add(default_company)
            session.commit()
            print("Default company inserted")
        else:
            default_company = existing_company
            print("Company already exists")
        


# Check if the merchant already exists (based on a unique field)
        existing_merchant = session.query(merchant_bvc).filter_by(MerchantId="BHARATHVENDQRUAT").first()

        if not existing_merchant:
            default_merchant = merchant_bvc(
                Gatewayname="PhonePe",
                ProviderID="BHARATHVENDPROVIDER",
                ProviderName="Bharath Vending Corporation",
                MerchantId="BHARATHVENDQRUAT",
                MerchantName="Bharath Vending Corporation",
                MerchantVPA="BHARATHVENDINGCORP@ybl",
                MerchantKey="30090e90-3a37-4fb1-b677-444ea3b2ee48",
                MCC=6513,
                KeyIndex=1,
                BaseUrl="https://mercury-uat.phonepe.com/enterprise-sandbox",
                PublicKeyPath="/path/to/public.pem",
                PrivateKeyPath="/path/to/private.pem",
                Vendor_id=default_vendor.Vendor_id  # Make sure this company_id exists
            )
            session.add(default_merchant)
            session.commit()
            print("Default merchant inserted")
        else:
            default_merchant = existing_merchant
            print("Default merchant already existed")

        
        existing_machine = session.query(machines_bvc).filter_by(Machine_Guid="78CF132655BB45A79CA4F8CE3604C445").first()
        if not existing_machine:
            default_machine = machines_bvc(
                Machine_Guid="78CF132655BB45A79CA4F8CE3604C445",
                AppType="VM",
                Machinenumber=1,
                Name="BHARATH VENDING CORPORATION",
                Mac="30138B8803C5",  
                Location="Coimbatore",
                Status="offline",
                Connection_id=None,  
                PgSettingId=default_merchant.Merchants_id,
                Createdon=datetime.utcnow(),
                Updatedon=datetime.utcnow(),
                IsActive=1,
                company_id=default_company.company_id,  
                Vendor_id=default_vendor.Vendor_id    
            )

            session.add(default_machine)
            session.commit()
            print("Default machine inserted")
        else:
            default_machine=existing_machine
            print("Default machine already existed")

        # Insert user
        existing_user = session.query(user_bvc).filter_by(username="A2Ba").first()
        if not existing_user:
            default_user = user_bvc(
                Vendor_id = default_vendor.Vendor_id,
                username="bvc24",
                email="ramkumarbvc24@gmail.com",
                password_hash=bcrypt.generate_password_hash("SuperAdmin@123").decode('utf-8'),
                role="superadmin"
            )
            session.add(default_user)
            session.commit()
            print("Default user inserted")
        else:
            print("Default user already exists")

    except Exception as e:
        print("Error during DB setup:", e)
    finally:
        session.close()



if __name__ == "__main__":
    setup_database()