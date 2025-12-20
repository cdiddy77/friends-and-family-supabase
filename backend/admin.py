import os
import argparse
import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from twilio.rest import Client as TwilioClient

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Must be service role for admin
TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_FROM = os.environ.get("TWILIO_PHONE_NUMBER")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
twilio_client = TwilioClient(TWILIO_SID, TWILIO_TOKEN) if TWILIO_SID else None

def create_user_if_not_exists(phone):
    # Ensure phone format (basic check)
    if not phone.startswith("+"):
        print("Phone must start with +")
        return None

    # Dummy email convention
    dummy_email = f"{phone.replace('+', '')}@example.com"

    try:
        # Try to create user
        # Note: The parameters for create_user might vary slightly by version, 
        # but generally accepts a dict of attributes.
        attributes = {
            "email": dummy_email,
            "phone": phone,
            "email_confirm": True,
            "phone_confirm": True,
            "user_metadata": {"phone": phone}
        }
        user = supabase.auth.admin.create_user(attributes)
        print(f"Created new user: {user.user.id}")
        return user.user.id
    except Exception as e:
        # If creation fails, assume user might exist and try to find them.
        # We search by email (our dummy email convention).
        # We can't easily search by phone in list_users without iterating.
        try:
            # Only getting page 1, assuming small user base. 
            # In production, would need pagination.
            users_response = supabase.auth.admin.list_users()
            for u in users_response:
                if u.phone == phone:
                    print(f"Found existing user: {u.id}")
                    return u.id
            
            print(f"Could not create user and could not find by phone: {e}")
            return None
        except Exception as search_err:
            print(f"Error searching for user: {search_err}")
            return None

def create_invite(phone):
    user_id = create_user_if_not_exists(phone)
    if not user_id:
        print("Could not get User ID")
        return None

    # Expiry: 2 weeks
    expires_at = (datetime.datetime.utcnow() + datetime.timedelta(weeks=2)).isoformat()
    
    data = {
        "user_id": user_id,
        "expires_at": expires_at
    }
    
    try:
        response = supabase.table("invites").insert(data).execute()
        if response.data:
            invite = response.data[0]
            print(f"Invite created for {phone}")
            print(f"Code: {invite['code']}")
            return invite['code']
        else:
            print("Failed to create invite record (no data returned)")
            return None
    except Exception as e:
        print(f"Error creating invite record: {e}")
        return None

def send_sms(phone, code, base_url):
    if not twilio_client:
        print("Twilio credentials not set. Skipping SMS.")
        return

    url = f"{base_url}/activate?code={code}"
    body = f"You are invited! Click here to login: {url}"
    
    try:
        message = twilio_client.messages.create(
            body=body,
            from_=TWILIO_FROM,
            to=phone
        )
        print(f"SMS sent: {message.sid}")
    except Exception as e:
        print(f"Error sending SMS: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command")
    
    invite_parser = subparsers.add_parser("invite")
    invite_parser.add_argument("phone")
    invite_parser.add_argument("--send", action="store_true", help="Send SMS via Twilio")
    invite_parser.add_argument("--url", default="http://localhost:3000", help="Base URL for the link")
    
    args = parser.parse_args()
    
    if args.command == "invite":
        code = create_invite(args.phone)
        if code and args.send:
            send_sms(args.phone, code, args.url)
        elif code:
            print(f"Link: {args.url}/activate?code={code}")

