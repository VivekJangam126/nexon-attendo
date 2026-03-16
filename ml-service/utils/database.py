"""
Database utilities for storing and retrieving face encodings
"""
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from config import Config

def get_db_connection():
    """
    Create database connection from Supabase URL
    
    Returns:
        psycopg2 connection object
    """
    # Parse Supabase URL to get database connection string
    # Format: https://xxx.supabase.co -> postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
    supabase_url = Config.SUPABASE_URL
    project_ref = supabase_url.split('//')[1].split('.')[0]
    
    # Use service role key as password for direct DB connection
    # Note: In production, use a dedicated database password
    db_password = "nexonattendo2024!"  # Use actual DB password
    
    conn = psycopg2.connect(
        host=f"db.{project_ref}.supabase.co",
        database="postgres",
        user="postgres",
        password=db_password,
        port=5432
    )
    return conn

def save_face_encoding(employee_id, encoding, confidence_threshold=80.0):
    """
    Save face encoding to database
    
    Args:
        employee_id: UUID of employee
        encoding: Face encoding array
        confidence_threshold: Minimum confidence for verification
        
    Returns:
        bool: Success status
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Convert numpy array to list for JSON storage
        encoding_list = encoding.tolist() if hasattr(encoding, 'tolist') else encoding
        
        # Check if encoding already exists
        cursor.execute(
            "SELECT id FROM face_encodings WHERE employee_id = %s",
            (employee_id,)
        )
        existing = cursor.fetchone()
        
        if existing:
            # Update existing encoding
            cursor.execute(
                """
                UPDATE face_encodings 
                SET encoding = %s, 
                    confidence_threshold = %s,
                    updated_at = NOW()
                WHERE employee_id = %s
                """,
                (json.dumps(encoding_list), confidence_threshold, employee_id)
            )
        else:
            # Insert new encoding
            cursor.execute(
                """
                INSERT INTO face_encodings (employee_id, encoding, confidence_threshold)
                VALUES (%s, %s, %s)
                """,
                (employee_id, json.dumps(encoding_list), confidence_threshold)
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving face encoding: {str(e)}")
        return False

def get_face_encoding(employee_id):
    """
    Retrieve face encoding from database
    
    Args:
        employee_id: UUID of employee
        
    Returns:
        tuple: (encoding_array, confidence_threshold) or (None, None)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            """
            SELECT encoding, confidence_threshold 
            FROM face_encodings 
            WHERE employee_id = %s
            """,
            (employee_id,)
        )
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
            encoding = json.loads(result['encoding'])
            threshold = float(result['confidence_threshold'])
            return encoding, threshold
        
        return None, None
    except Exception as e:
        print(f"Error retrieving face encoding: {str(e)}")
        return None, None

def log_verification_attempt(employee_id, attendance_id, confidence_score, status, processing_time, error_message=None):
    """
    Log face verification attempt
    
    Args:
        employee_id: UUID of employee
        attendance_id: UUID of attendance record (can be None)
        confidence_score: Confidence score (0-100)
        status: 'success', 'failed', 'no_face', 'error'
        processing_time: Processing time in milliseconds
        error_message: Error message if failed
        
    Returns:
        bool: Success status
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            INSERT INTO face_verification_logs 
            (employee_id, attendance_id, confidence_score, verification_status, processing_time_ms, error_message)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (employee_id, attendance_id, confidence_score, status, processing_time, error_message)
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error logging verification: {str(e)}")
        return False
