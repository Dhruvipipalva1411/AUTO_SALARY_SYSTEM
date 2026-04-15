from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Employee, Attendance, Salary
from datetime import date, datetime
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """
    Get dashboard statistics
    Returns counts for employees, attendance, and payroll
    """
    try:
        total_employees = Employee.query.count()
        # Get today's date
        today = date.today()
        
        # Get present today (DISTINCT employees with check-in today)
        # Use distinct to avoid counting same employee multiple times if they check in/out multiple times
        present_today = db.session.query(Attendance.employee_id).filter(
            Attendance.date == today,
            Attendance.check_in.isnot(None)
        ).distinct().count()
        
        # Get absent today (total employees - present today)
        # Ensure it's never negative using max()
        absent_today = max(0, total_employees - present_today)
        employees_with_salary = db.session.query(Salary.employee_id).distinct().all()
        employee_ids_with_salary = [emp[0] for emp in employees_with_salary]
        pending_salary = Employee.query.filter(
            ~Employee.id.in_(employee_ids_with_salary)
        ).count() if employee_ids_with_salary else total_employees
        
        return jsonify({
            'total_employees': total_employees,
            'present_today': present_today,
            'absent_today': absent_today,
            'pending_payroll': pending_salary
        }), 200
        
    except Exception as e:
        return jsonify({'msg': f'Error fetching stats: {str(e)}'}), 500


@dashboard_bp.route('/dashboard/recent-activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    """
    Get recent activity (last 10 attendance records)
    """
    try:
        recent_attendance = Attendance.query\
            .order_by(Attendance.created_at.desc())\
            .limit(10)\
            .all()
        
        activities = []
        for record in recent_attendance:
            employee = Employee.query.get(record.employee_id)
            if employee:
                user = User.query.get(employee.user_id)
                activities.append({
                    'id': record.id,
                    'employee_name': user.username if user else 'Unknown',
                    'action': 'Check-in' if record.check_in else 'Check-out',
                    'time': record.check_in.isoformat() if record.check_in else record.check_out.isoformat(),
                    'date': record.date.isoformat()
                })
        
        return jsonify({'activities': activities}), 200
        
    except Exception as e:
        return jsonify({'msg': f'Error fetching activity: {str(e)}'}), 500
