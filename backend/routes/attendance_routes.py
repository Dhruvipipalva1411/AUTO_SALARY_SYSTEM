from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Attendance, Employee
from datetime import datetime

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/checkinout', methods=['POST'])
@jwt_required()
def checkinout():
    data = request.json or {}
    employee_id = data.get('employee_id')  
    
    if not employee_id:
        return jsonify({"msg": "employee_id required"}), 400
    
    emp = Employee.query.filter_by(id=employee_id).first()  
    if not emp:
        return jsonify({"msg": f"Employee ID {employee_id} not found"}), 404
    
    today = datetime.now().date()
    today_attendance = Attendance.query.filter_by(
        employee_id=emp.id, 
        date=today
    ).first()
  
    current_time = datetime.now()
  
    if not today_attendance or not today_attendance.check_in:
        # CHECK-IN (handles NULL check_in too!)
        if today_attendance:
            today_attendance.check_in = current_time
            today_attendance.working_hours = 0.0
        else:
            attendance = Attendance(
                employee_id=emp.id,
                date=today,
                check_in=current_time,
                working_hours=0.0
            )
            db.session.add(attendance)
            db.session.commit()
        db.session.commit()
        return jsonify({
            'msg': 'Check-in successful!',
            'time': current_time.strftime('%H:%M:%S'),
            'status': 'IN'
        })
    elif not today_attendance.check_out:
        # CHECKOUT - BULLETPROOF!
        closing_time_str = emp.company_closing_time or '18:00:00'
        closing_time = datetime.strptime(closing_time_str, '%H:%M:%S').time()
        
        if current_time.time() > closing_time:
            checkout_time = datetime.combine(today, closing_time)
            status_msg = f"Auto-closed at company time {closing_time_str}"
        else:
            checkout_time = current_time
            status_msg = f"Checkout at {current_time.strftime('%H:%M:%S')}"
        
        total_hours = round((checkout_time - today_attendance.check_in).total_seconds() / 3600, 2)
        
        today_attendance.check_out = checkout_time
        today_attendance.working_hours = total_hours
        db.session.commit()
        
        return jsonify({
            'msg': f'{status_msg} - {total_hours} hrs worked!',
            'checkin': today_attendance.check_in.strftime('%H:%M'),
            'checkout': checkout_time.strftime('%H:%M'),
            'hours': total_hours,
            'status': 'OUT'
        })
    else:
        return jsonify({"msg": "Already checked in/out today!"}), 400
