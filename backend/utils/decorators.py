from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt

def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role')
            if user_role not in allowed_roles:
                return jsonify({'msg': f'Access denied. Required: {allowed_roles}'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator
