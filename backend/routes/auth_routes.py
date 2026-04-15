from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash
from database import db
from models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')  # NEW: Separate email field
    username = data.get('username')  # Username field
    password = data.get('password')
    
    if not password:
        return jsonify({'msg': 'Password required'}), 400
    
    user = None
    
    # Try username if provided
    if username:
        user = User.query.filter_by(username=username).first()
        print(f"Trying username: {username} -> {user.username if user else 'Not found'}")
    
    # Try email if provided (and no username match)
    if not user and email:
        user = User.query.filter_by(email=email).first()
        print(f"Trying email: {email} -> {user.email if user else 'Not found'}")
    
    # Check password
    if user and check_password_hash(user.password_hash, password):
        access_token = create_access_token(
            identity=user.id,
            additional_claims={'role': user.role}
        )
        return jsonify({
            'access_token': access_token,
            'role': user.role,
            'user_id': user.id
        })
    
    return jsonify({'msg': 'Invalid credentials'}), 401

# @auth_bp.route('/login', methods=['POST'])
# def login():
#     data = request.json
#     user = User.query.filter_by(username=data['username']).first()
#     if user and check_password_hash(user.password_hash, data['password']):
#         access_token = create_access_token(
#             identity=user.id,
#             additional_claims={'role': user.role}  
#         )
#         return jsonify({
#             'access_token': access_token,
#             'role': user.role  
#         })
#     return jsonify({'msg': 'Invalid credentials'}), 401

    
# @auth_bp.route('/login', methods=['POST'])
# def login():
#     data = request.json
#     user = User.query.filter_by(username=data['username']).first()
#     if user and check_password_hash(user.password_hash, data['password']):
#         token = create_access_token(
#             identity=user.id,
#             additional_claims={'role': user.role} 
#         )   
#         return jsonify({'token': token, 'role': user.role})
#     return jsonify({'msg': 'Bad credentials'}), 401