import os
import secrets
env_file = ".env"
from flask import Flask,Blueprint

key_print=Blueprint("generate_secret",__name__)

@key_print.route("/generate-key", methods=["GET"])
def generate_key():
    if not os.path.exists(env_file):
        jwt_secret = secrets.token_hex(32)
        with open(env_file,"w") as f:
            f.write(f"JWT_SECRET_KEY={jwt_secret}\n")
        print(f"Generated JWT_SECRET_KEY: {jwt_secret}")
    else:
        print(".env file already exists. Skipping secret key generation.")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")