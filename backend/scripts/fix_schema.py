import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database.database import engine

def run_sql(query):
    with engine.connect() as conn:
        try:
            conn.execute(text(query))
            conn.commit()
            print(f"Executed: {query}")
        except Exception as e:
            print(f"Error executing {query}: {e}")

# Add missing columns safely
run_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp VARCHAR NULL")
run_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expired_at TIMESTAMP NULL")
run_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL")

print("Schema update complete")