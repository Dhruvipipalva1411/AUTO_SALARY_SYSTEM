from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Employee, User
from utils.decorators import role_required

employee_bp = Blueprint('employee', __name__)

@employee_bp.route('/employees', methods=['GET'])
@jwt_required()
def get_all_employees():
    """Get all employee records (not users, but actual employees table)"""
    try:
        employees = Employee.query.all()
        
        employee_list = []
        for emp in employees:
            user = User.query.get(emp.user_id)
            employee_list.append({
                'id': emp.id,
                'user_id': emp.user_id,
                'username': user.username if user else 'Unknown',
                'email': user.email if user else 'Unknown',
                'role': user.role if user else 'Unknown',
                'hourly_rate': float(emp.hourly_rate) if emp.hourly_rate else 0,
                'company_closing_time': emp.company_closing_time,
                'created_at': emp.created_at.isoformat() if emp.created_at else None
            })
        
        return jsonify({'employees': employee_list}), 200
    except Exception as e:
        return jsonify({'msg': f'Error fetching employees: {str(e)}'}), 500

@employee_bp.route('/employees', methods=['POST'])
@role_required('Admin', 'HR')
@jwt_required()
def create_employee():
    """Create employee record for a user"""
    try:
        data = request.json
        user_id = data.get('user_id')
        hourly_rate = data.get('hourly_rate', 50.0)  # Default $50/hr
        company_closing_time = data.get('company_closing_time', '19:00:00')  # Default 7 PM
        
        if not user_id:
            return jsonify({'msg': 'user_id required'}), 400
        
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'msg': 'User not found'}), 404
        
        # Check if employee record already exists
        existing = Employee.query.filter_by(user_id=user_id).first()
        if existing:
            return jsonify({'msg': 'Employee record already exists for this user'}), 400
        
        # Create employee record
        employee = Employee(
            user_id=user_id,
            hourly_rate=hourly_rate,
            company_closing_time=company_closing_time
        )
        db.session.add(employee)
        db.session.commit()
        
        return jsonify({
            'msg': 'Employee record created successfully',
            'employee_id': employee.id,
            'user_id': user_id,
            'username': user.username,
            'hourly_rate': float(hourly_rate)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Error creating employee: {str(e)}'}), 500

@employee_bp.route('/employees/<int:employee_id>', methods=['PUT'])
@role_required('Admin', 'HR')
@jwt_required()
def update_employee(employee_id):
    """Update employee record"""
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'msg': 'Employee not found'}), 404
        
        data = request.json
        if 'hourly_rate' in data:
            employee.hourly_rate = data['hourly_rate']
        if 'company_closing_time' in data:
            employee.company_closing_time = data['company_closing_time']
        
        db.session.commit()
        
        return jsonify({
            'msg': 'Employee updated successfully',
            'employee_id': employee.id,
            'hourly_rate': float(employee.hourly_rate)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Error updating employee: {str(e)}'}), 500

@employee_bp.route('/employees/<int:employee_id>', methods=['DELETE'])
@role_required('Admin')
@jwt_required()
def delete_employee(employee_id):
    """Delete employee record"""
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'msg': 'Employee not found'}), 404
        
        db.session.delete(employee)
        db.session.commit()
        
        return jsonify({'msg': 'Employee deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Error deleting employee: {str(e)}'}), 500

@employee_bp.route('/api/employee', methods=['POST'])
@role_required('Admin', 'HR')
@jwt_required()
def create_employee_for_user(user_id):
    """Quick endpoint to create employee record for existing user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'msg': f'User ID {user_id} not found'}), 404
        
        # Check if employee already exists
        existing = Employee.query.filter_by(user_id=user_id).first()
        if existing:
            return jsonify({
                'msg': 'Employee record already exists',
                'employee_id': existing.id,
                'hourly_rate': float(existing.hourly_rate)
            }), 200
        
        # Create employee with default values
        employee = Employee(
            user_id=user_id,
            hourly_rate=50.0,  # Default $50/hour
            company_closing_time='19:00:00'  # 7 PM
        )
        db.session.add(employee)
        db.session.commit()
        
        return jsonify({
            'msg': f'Employee record created for {user.username}',
            'employee_id': employee.id,
            'user_id': user_id,
            'username': user.username,
            'hourly_rate': 50.0
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Error: {str(e)}'}), 500
