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
        db.session.flush()  # Flush to get the user.id
        
        # Automatically create employee record for Employee role
        if data['role'] == 'Employee':
            employee = Employee(
                user_id=user.id,
                hourly_rate=data.get('hourly_rate', 15.00),  # Default hourly rate
                company_closing_time='18:00:00'
            )
            db.session.add(employee)
        
        db.session.commit()
        return jsonify({'msg': 'User created successfully!', 'id': user.id})
    except IntegrityError:
        db.session.rollback()
        return jsonify({'msg': 'Username or email already exists!'}), 409

@user_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users with their employee IDs"""
    identity = get_jwt_identity()
    current_user_id = int(identity)
    current_user = User.query.get(current_user_id)
    
    if current_user.role in ['Admin', 'HR']:
        # Admin/HR: See ALL users with employee IDs
        users = User.query.all()
        result = []
        for u in users:
            # Get employee record if exists
            emp = Employee.query.filter_by(user_id=u.id).first()
            result.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'role': u.role,
                'employee_id': emp.id if emp else None,  # Include employee ID
                'created_at': u.created_at.isoformat() if u.created_at else None
            })
        return jsonify({'users': result})
    else:
        # Employee: See only self
        user = User.query.get(current_user_id)
        if user:
            return jsonify({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role
                }
            })
        return jsonify({'msg': 'User not found'}), 404

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
        
    # Also update Employee record if exists and fields provided
    employee = Employee.query.filter_by(user_id=user.id).first()
    if employee:
        if 'hourly_rate' in data:
            employee.hourly_rate = data['hourly_rate']
        if 'company_closing_time' in data:
            employee.company_closing_time = data['company_closing_time']
    
    db.session.commit()
    return jsonify({'msg': 'User updated successfully!', 'id': user.id})

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_current_user_profile():
    """Get current user's profile information"""
    identity = get_jwt_identity()
    user_id = int(identity)
    user = User.query.get_or_404(user_id)
    
    # Get employee record if exists
    employee = Employee.query.filter_by(user_id=user_id).first()
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'employee_id': employee.id if employee else None,
        'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None
    })

@user_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change current user's password"""
    from werkzeug.security import check_password_hash
    
    identity = get_jwt_identity()
    user_id = int(identity)
    user = User.query.get_or_404(user_id)
    
    data = request.json
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'msg': 'Current password and new password are required'}), 400
    
    # Verify current password
    if not check_password_hash(user.password_hash, current_password):
        return jsonify({'msg': 'Current password is incorrect'}), 401
    
    # Validate new password
    if len(new_password) < 6:
        return jsonify({'msg': 'New password must be at least 6 characters'}), 400
    
    # Update password
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    
    return jsonify({'msg': 'Password changed successfully'})

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

@user_bp.route('/users/fix-employee-records', methods=['POST'])
@jwt_required()
def fix_employee_records():
    """Create employee records for users who don't have them"""
    identity = get_jwt_identity()
    user_id = int(identity)
    current_user = User.query.get(user_id)
    
    if current_user.role not in ['Admin', 'HR']:
        return jsonify({'msg': 'Unauthorized'}), 403
    
    try:
        # Find all Employee role users without employee records
        all_users = User.query.filter_by(role='Employee').all()
        fixed_count = 0
        fixed_users = []
        
        for user in all_users:
            # Check if employee record exists
            existing_employee = Employee.query.filter_by(user_id=user.id).first()
            if not existing_employee:
                # Create employee record
                employee = Employee(
                    user_id=user.id,
                    hourly_rate=15.00,  # Default hourly rate
                    company_closing_time='18:00:00'
                )
                db.session.add(employee)
                fixed_count += 1
                fixed_users.append({
                    'user_id': user.id,
                    'username': user.username
                })
        
        db.session.commit()
        
        return jsonify({
            'msg': f'Sync Complete: Found and fixed {fixed_count} missing employee records.',
            'fixed_users': fixed_users
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Error fixing employee records: {str(e)}'}), 500
