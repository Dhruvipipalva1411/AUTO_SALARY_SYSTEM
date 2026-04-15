from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Attendance, Employee, User
from datetime import datetime, date, timedelta
from utils.decorators import role_required

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/attendance', methods=['GET'])
@jwt_required()
def get_all_attendance():
    """Get all attendance records with employee names - ONE record per employee per day"""
    try:
        from sqlalchemy import func
        
        # Query to get one record per employee per day with earliest check_in and latest check_out
        # Group by employee_id and date
        subquery = db.session.query(
            Attendance.employee_id,
            Attendance.date,
            func.min(Attendance.check_in).label('earliest_check_in'),
            func.max(Attendance.check_out).label('latest_check_out'),
            func.max(Attendance.id).label('record_id')  # Use latest record ID for reference
        ).group_by(
            Attendance.employee_id,
            Attendance.date
        ).subquery()
        
        # Join with main attendance table to get full record details
        attendance_records = db.session.query(
            Attendance,
            subquery.c.earliest_check_in,
            subquery.c.latest_check_out
        ).join(
            subquery,
            (Attendance.employee_id == subquery.c.employee_id) &
            (Attendance.date == subquery.c.date) &
            (Attendance.id == subquery.c.record_id)
        ).order_by(Attendance.date.desc()).all()
        
        result = []
        for record, earliest_check_in, latest_check_out in attendance_records:
            employee = Employee.query.get(record.employee_id)
            employee_name = "Unknown"
            user_id = None
            if employee:
                user = User.query.get(employee.user_id)
                if user:
                    employee_name = user.username
                    user_id = user.id
            
            # Calculate working hours based on earliest check-in and latest check-out
            working_hours = 0
            working_hours_formatted = "0h 0m"
            if earliest_check_in and latest_check_out:
                # Convert to datetime for calculation
                check_in_dt = datetime.combine(record.date, earliest_check_in.time()) if isinstance(earliest_check_in, datetime) else datetime.combine(record.date, earliest_check_in)
                check_out_dt = datetime.combine(record.date, latest_check_out.time()) if isinstance(latest_check_out, datetime) else datetime.combine(record.date, latest_check_out)
                delta = check_out_dt - check_in_dt
                working_hours = round(delta.total_seconds() / 3600, 2)
                
                # Format as "Xh Ym" for better readability
                total_minutes = int(delta.total_seconds() / 60)
                hours = total_minutes // 60
                minutes = total_minutes % 60
                working_hours_formatted = f"{hours}h {minutes}m"
            
            result.append({
                'id': record.id,
                'employee_id': record.employee_id,
                'user_id': user_id,  # Added user_id
                'employee_name': employee_name,
                'date': record.date.isoformat() if record.date else None,
                'check_in': earliest_check_in.isoformat() if earliest_check_in else None,
                'check_out': latest_check_out.isoformat() if latest_check_out else None,
                'working_hours': working_hours,
                'working_hours_formatted': working_hours_formatted,  # Human-readable format
                'created_at': record.created_at.isoformat() if record.created_at else None
            })
        
        return jsonify({'attendance': result}), 200
    except Exception as e:
        return jsonify({'msg': f'Error fetching attendance: {str(e)}'}), 500

@attendance_bp.route('/checkinout', methods=['POST'])
@jwt_required()
@role_required('Admin', 'HR')
def checkinout():
    """
    Handle check-in and check-out with SINGLE RECORD PER USER PER DAY.
    
    Business Rules:
    - ONE attendance record per user per day (enforced)
    - First check-in: Create record with check_in time
    - Subsequent check-ins: Keep earliest check_in time
    - Every check-out: Update check_out to latest time
    - Recalculate working_hours on each update
    - Office hours: 10:00 AM - 7:00 PM
    """
    data = request.json or {}
    data = request.json or {}
    employee_id = data.get('employee_id')
    user_id = data.get('user_id')
    
    if not employee_id and not user_id:
        return jsonify({"msg": "Employee ID or User ID required"}), 400
        
    emp = None
    
    # Try to find by employee_id first
    if employee_id:
        emp = Employee.query.get(employee_id)
        
    # If not found or not provided, try by user_id
    if not emp and user_id:
        emp = Employee.query.filter_by(user_id=user_id).first()
    
    if not emp:
        return jsonify({"msg": f"Employee record not found."}), 404
    
    user = User.query.get(emp.user_id)
    if not user:
        return jsonify({"msg": f"User record not found for employee ID {employee_id}."}), 404
    
    # Office hours validation
    OFFICE_OPEN = datetime.strptime('10:00:00', '%H:%M:%S').time()
    OFFICE_CLOSE = datetime.strptime('19:00:00', '%H:%M:%S').time()
    
    current_time = datetime.now()
    current_time_only = current_time.time()
    today = current_time.date()
    
    # Find or create TODAY'S attendance record (SINGLE RECORD PER DAY)
    attendance_record = Attendance.query.filter_by(
        employee_id=emp.id,
        date=today
    ).first()
    
    # Determine current status based on existing record
    if not attendance_record:
        # NO RECORD EXISTS - This is FIRST check-in of the day
        # Validate check-in time
        if current_time_only < OFFICE_OPEN:
            return jsonify({
                "msg": f"Check-in not allowed before 10:00 AM.",
                "current_time": current_time.strftime('%H:%M:%S')
            }), 400
        
        if current_time_only >= OFFICE_CLOSE:
            return jsonify({
                "msg": f"Check-in not allowed after 7:00 PM.",
                "current_time": current_time.strftime('%H:%M:%S')
            }), 400
        
        # Create new attendance record
        attendance_record = Attendance(
            employee_id=emp.id,
            date=today,
            check_in=current_time,
            check_out=None,
            working_hours=0.0
        )
        db.session.add(attendance_record)
        db.session.commit()
        
        return jsonify({
            'msg': 'Check-in successful!',
            'time': current_time.strftime('%H:%M:%S'),
            'status': 'IN',
            'employee_name': user.username
        }), 200
    
    # RECORD EXISTS - Determine if user is currently IN or OUT
    is_currently_in = (attendance_record.check_in is not None and 
                      attendance_record.check_out is not None)
    
    if not is_currently_in:
        # User is currently IN (has check_in but no check_out)
        # This is a CHECK-OUT action
        if current_time_only >= OFFICE_CLOSE:
            return jsonify({
                "msg": f"Check-out not allowed after 7:00 PM.",
                "current_time": current_time.strftime('%H:%M:%S')
            }), 400
        
        # Update check_out time (latest check-out)
        attendance_record.check_out = current_time
        
        # Recalculate working hours
        if attendance_record.check_in:
            time_diff = current_time - attendance_record.check_in
            hours = time_diff.total_seconds() / 3600
            attendance_record.working_hours = round(hours, 2)
        
        db.session.commit()
        
        return jsonify({
            'msg': 'Check-out successful!',
            'time': current_time.strftime('%H:%M:%S'),
            'status': 'OUT',
            'working_hours': float(attendance_record.working_hours),
            'employee_name': user.username
        }), 200
    
    else:
        # User is currently OUT (has both check_in and check_out)
        # This is a RE-CHECK-IN action
        if current_time_only < OFFICE_OPEN:
            return jsonify({
                "msg": f"Check-in not allowed before 10:00 AM.",
                "current_time": current_time.strftime('%H:%M:%S')
            }), 400
        
        if current_time_only >= OFFICE_CLOSE:
            return jsonify({
                "msg": f"Check-in not allowed after 7:00 PM.",
                "current_time": current_time.strftime('%H:%M:%S')
            }), 400
        
        # Keep earliest check-in time, clear check-out for re-entry
        # This allows user to check back in after checking out
        attendance_record.check_out = None
        db.session.commit()
        
        return jsonify({
            'msg': 'Re-check-in successful!',
            'time': current_time.strftime('%H:%M:%S'),
            'status': 'IN',
            'employee_name': user.username
        }), 200

@attendance_bp.route('/auto-checkout', methods=['POST'])
def auto_checkout_employees():
    """
    Automatically check out employees who forgot to check out at company closing time.
    This endpoint should be called by a scheduler at 7:00 PM daily.
    """
    try:
        OFFICE_CLOSE = datetime.strptime('19:00:00', '%H:%M:%S').time()
        current_time = datetime.now()
        today = current_time.date()
        
        # Find all attendance records for today where employee is still checked in
        # (has check_in but no check_out)
        records_to_checkout = Attendance.query.filter(
            Attendance.date == today,
            Attendance.check_in.isnot(None),
            Attendance.check_out.is_(None)
        ).all()
        
        if not records_to_checkout:
            return jsonify({
                'msg': 'No employees need auto-checkout',
                'count': 0
            }), 200
        
        checked_out_employees = []
        
        for record in records_to_checkout:
            # Get employee info
            employee = Employee.query.get(record.employee_id)
            if not employee:
                continue
                
            user = User.query.get(employee.user_id)
            employee_name = user.username if user else 'Unknown'
            
            # Set checkout time to company closing time (7:00 PM)
            checkout_datetime = datetime.combine(today, OFFICE_CLOSE)
            record.check_out = checkout_datetime
            
            # Calculate working hours
            if record.check_in:
                time_diff = checkout_datetime - record.check_in
                hours = time_diff.total_seconds() / 3600
                record.working_hours = round(hours, 2)
            
            checked_out_employees.append({
                'employee_id': record.employee_id,
                'employee_name': employee_name,
                'check_in': record.check_in.strftime('%H:%M:%S'),
                'auto_check_out': checkout_datetime.strftime('%H:%M:%S'),
                'working_hours': float(record.working_hours)
            })
        
        db.session.commit()
        
        return jsonify({
            'msg': f'Successfully auto-checked out {len(checked_out_employees)} employee(s)',
            'count': len(checked_out_employees),
            'employees': checked_out_employees
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Error in auto-checkout: {str(e)}'}), 500

@attendance_bp.route('/fix-forgotten-checkouts', methods=['POST'])
@role_required('Admin', 'HR')
@jwt_required()
def fix_forgotten_checkouts():
    target_date = datetime.now().date() - timedelta(days=1)
    closing_time_str = '19:00:00'
    closing_time = datetime.strptime(closing_time_str, '%H:%M:%S').time()
    closing_datetime = datetime.combine(target_date, closing_time)
    
    # Find open check-ins (check_in YES, check_out NO)
    open_attendances = db.session.query(Attendance).filter(
        Attendance.date == target_date,
        Attendance.check_in.isnot(None),
        Attendance.check_out.is_(None)
    ).all()
    
    fixed_count = 0
    for attendance in open_attendances:
        total_seconds = (closing_datetime - attendance.check_in).total_seconds()
        hours = int(total_seconds // 3600)
        minutes = int((total_seconds % 3600) // 60)
        attendance.check_out = closing_datetime
        attendance.working_hours = hours + minutes / 60
        fixed_count += 1    
    
    db.session.commit()
    
    return jsonify({
        'msg': f'FIXED {fixed_count} forgotten check-ins at 7 PM!',
        'date_fixed': target_date.strftime('%Y-%m-%d'),
        'auto_checkout': '19:00:00',
        'fixed_employees': [f"ID:{a.employee_id}" for a in open_attendances]
    })

@attendance_bp.route('/auto-close-daily', methods=['POST'])
@role_required('Admin', 'HR')
@jwt_required()
def auto_close_daily():
    yesterday = datetime.now().date() - timedelta(days=1)
    closing_datetime = datetime.combine(yesterday, time(19, 0))  
    
    open_attendances = db.session.query(Attendance).filter(
        Attendance.date == yesterday,
        Attendance.check_in.isnot(None),
        Attendance.check_out.is_(None)
    ).all()
    
    closed = 0
    for att in open_attendances:
        hours = round((closing_datetime - att.check_in).total_seconds() / 3600, 2)
        att.check_out = closing_datetime
        att.working_hours = hours
        closed += 1
    
    db.session.commit()
    return jsonify({'msg': f'Daily auto-close: {closed} records closed at 7 PM!'})
