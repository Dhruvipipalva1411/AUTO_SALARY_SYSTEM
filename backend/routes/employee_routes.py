from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Employee

employee_bp = Blueprint('employee', __name__)

@employee_bp.route('/employee', methods=['GET'])
@jwt_required()
def get_employee():
    identity = get_jwt_identity()
    user_id = int(identity)  
    current_user = User.query.get(user_id)
    
    if current_user.role == 'Employee':
        emp = Employee.query.filter_by(user_id=user_id).first()
        if emp:
            return jsonify({
                'employee': {
                    'id': emp.id,
                    'user_id': emp.user_id,
                    'hourly_rate': float(emp.hourly_rate),
                    'closing_time': emp.company_closing_time
                }
            })
        return jsonify({'msg': 'No employee record'}), 404
    
    # Admin/HR see all employees
    employees = Employee.query.all()
    return jsonify({
        'employees': [{
            'id': e.id,
            'user_id': e.user_id,
            'username': User.query.get(e.user_id).username,
            'hourly_rate': float(e.hourly_rate),
            'closing_time': e.company_closing_time
        } for e in employees]
    })

@employee_bp.route('/employee', methods=['POST'])
@jwt_required()
def create_employee():
    identity = get_jwt_identity()
    user_id = int(identity)  
    current_user = User.query.get(user_id)
    
    if current_user.role not in ['Admin', 'HR']:
        return jsonify({'msg': 'Only Admin/HR can create employees'}), 403
    
    data = request.json
    user_id = data['user_id']
    employee = Employee(
        user_id=user_id,
        hourly_rate=data.get('hourly_rate', 0),
        company_closing_time=data.get('closing_time', '18:00:00')
    )
    db.session.add(employee)
    db.session.commit()
    return jsonify({'msg': 'Employee created', 'id': employee.id})
