from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from database import db
from models import User
from models import Employee, Attendance, Salary

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    identity = get_jwt_identity()
    user_id = int(identity)
    current_user = User.query.get(user_id)
    
    if current_user.role not in ['Admin', 'HR']:
        return jsonify({'msg': 'Unauthorized'}), 403
    
    data = request.json

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'msg': f'Username "{data["username"]}" already exists!'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'msg': f'Email "{data["email"]}" already registered!'}), 409
    
    try:
        user = User(
            username=data['username'],
            password_hash=generate_password_hash(data['password']),
            role=data['role'],
            email=data['email']
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({'msg': 'User created successfully!', 'id': user.id})
    except IntegrityError:
        db.session.rollback()
        return jsonify({'msg': 'Username or email already exists!'}), 409

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    identity = get_jwt_identity()
    current_user_id = int(identity)
    current_user = User.query.get(current_user_id)
    
    if current_user.role not in ['Admin', 'HR']:
        return jsonify({'msg': 'Unauthorized'}), 403
    
    user = User.query.get_or_404(user_id)
    data = request.json
    
    new_username = data.get('username', user.username)
    if new_username != user.username and User.query.filter_by(username=new_username).first():
        return jsonify({'msg': f'Username "{new_username}" already taken!'}), 409
    
    user.username = new_username
    user.email = data.get('email', user.email)
    if 'password' in data:
        user.password_hash = generate_password_hash(data['password'])
    
    db.session.commit()
    return jsonify({'msg': 'User updated successfully!', 'id': user.id})

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    identity = get_jwt_identity()
    current_user_id = int(identity)
    current_user = User.query.get(current_user_id)
    
    if current_user.role not in ['Admin', 'HR']:
        return jsonify({'msg': 'Unauthorized'}), 403
    
    if user_id == current_user_id:
        return jsonify({'msg': 'Cannot delete yourself'}), 400
    
    user = User.query.get_or_404(user_id)
    username = user.username
    
    db.session.query(Salary).filter(Salary.employee_id.in_(
        db.session.query(Employee.id).filter(Employee.user_id == user_id)
    )).delete()
    
    db.session.query(Attendance).filter(Attendance.employee_id.in_(
        db.session.query(Employee.id).filter(Employee.user_id == user_id)
    )).delete()
    
    db.session.query(Employee).filter(Employee.user_id == user_id).delete()
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'msg': f'User {username} + ALL records deleted!'})