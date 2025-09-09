from sqlalchemy import create_engine,text
from sqlalchemy.orm import sessionmaker

MYSQL="mysql+pymysql://root:BVC%40123@localhost:3306"
# MYSQL="mysql+pymysql://bvc:bvc24@localhost:3306"
# MYSQL="mysql+pymysql://root:Rahul001@localhost:3306"
# MYSQL="mysql+pymysql://bvc:MsiSCB#02@52.66.236.128:3306"



engine=create_engine(MYSQL,echo=True)

Database_name="BVC24"

db_status=False

try:
    with engine.connect() as connection:
        connection.execute(text(f"CREATE DATABASE IF NOT EXISTS {Database_name}"))
        print(f"{Database_name} database created successfully")
        db_status=True
except Exception as e:
    print("Operation failed: Could not initialize the database.",e)
    
    
if db_status==True:
    database_url=f"mysql+pymysql://root:BVC%40123@localhost:3306/{Database_name}"   
    # database_url=f"mysql+pymysql://bvc:bvc24@localhost:3306/{Database_name}"   
    engine=create_engine(database_url,echo=True)
    SessionLocal=sessionmaker(bind=engine)
    session=SessionLocal()
    print("Database Created successfully ready to work")
    session.close()
    
else:
    print("Unable to create database due to an internal error.")