from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Salary, Employee, User, Attendance
from datetime import datetime, timedelta
from utils.decorators import role_required
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

salary_bp = Blueprint('salary', __name__)

SENDER_EMAIL = "pipalva03@gmail.com"           
SENDER_PASSWORD = "yxei zqkz vpxg bllc"

def generate_pdf(name, amount, hours, rate, salary_id, period):
    """Generate a professional salary slip PDF"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Colors (RGB)
    primary_color = (0.02, 0.09, 0.16)  # Dark blue
    accent_color = (0.02, 0.71, 0.83)   # Cyan
    text_color = (0.2, 0.2, 0.2)        # Dark gray
    light_bg = (0.95, 0.97, 0.98)       # Light blue-gray
    
    # Header Section with Company Branding
    c.setFillColorRGB(*primary_color)
    c.rect(0, height - 120, width, 120, fill=True, stroke=False)
    
    # Company Name
    c.setFillColorRGB(1, 1, 1)  # White
    c.setFont("Helvetica-Bold", 28)
    c.drawString(50, height - 60, "AUTO SALARY SYSTEM")
    
    c.setFont("Helvetica", 11)
    c.drawString(50, height - 80, "Automated Payroll & Attendance Management")
    c.drawString(50, height - 95, "Email: hr@autosalary.com | Phone: +1 (555) 123-4567")
    
    # Salary Slip Title
    c.setFillColorRGB(*accent_color)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(width - 200, height - 70, "SALARY SLIP")
    
    # Period and Salary ID
    c.setFont("Helvetica", 10)
    c.setFillColorRGB(1, 1, 1)
    c.drawString(width - 200, height - 90, f"Period: {period}")
    c.drawString(width - 200, height - 105, f"Slip ID: #{salary_id}")
    
    # Employee Information Section
    y_position = height - 160
    c.setFillColorRGB(*text_color)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y_position, "EMPLOYEE INFORMATION")
    
    # Employee details box
    y_position -= 25
    c.setFillColorRGB(*light_bg)
    c.rect(50, y_position - 60, width - 100, 60, fill=True, stroke=False)
    
    c.setFillColorRGB(*text_color)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(60, y_position - 20, "Employee Name:")
    c.drawString(60, y_position - 40, "Generated On:")
    
    c.setFont("Helvetica", 11)
    c.drawString(180, y_position - 20, name)
    c.drawString(180, y_position - 40, datetime.now().strftime('%B %d, %Y at %I:%M %p'))
    
    # Earnings Breakdown Section
    y_position -= 100
    c.setFillColorRGB(*text_color)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y_position, "EARNINGS BREAKDOWN")
    
    # Table Header
    y_position -= 30
    c.setFillColorRGB(*primary_color)
    c.rect(50, y_position - 25, width - 100, 25, fill=True, stroke=False)
    
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(60, y_position - 15, "DESCRIPTION")
    c.drawString(width - 250, y_position - 15, "DETAILS")
    c.drawString(width - 150, y_position - 15, "AMOUNT")
    
    # Table Rows
    y_position -= 25
    
    # Format hours as "Xh Ym"
    total_minutes = int(hours * 60)
    hours_formatted = f"{total_minutes // 60}h {total_minutes % 60}m"
    
    # Row 1: Working Hours
    c.setFillColorRGB(*light_bg)
    c.rect(50, y_position - 25, width - 100, 25, fill=True, stroke=False)
    c.setFillColorRGB(*text_color)
    c.setFont("Helvetica", 10)
    c.drawString(60, y_position - 15, "Total Working Hours")
    c.drawString(width - 250, y_position - 15, hours_formatted)
    c.drawString(width - 150, y_position - 15, "-")
    
    # Row 2: Hourly Rate
    y_position -= 25
    c.setFont("Helvetica", 10)
    c.drawString(60, y_position - 15, "Hourly Rate")
    c.drawString(width - 250, y_position - 15, f"${float(rate):.2f}/hour")
    c.drawString(width - 150, y_position - 15, "-")
    
    # Row 3: Gross Salary
    y_position -= 25
    c.setFillColorRGB(*light_bg)
    c.rect(50, y_position - 25, width - 100, 25, fill=True, stroke=False)
    c.setFillColorRGB(*text_color)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(60, y_position - 15, "Gross Salary")
    c.drawString(width - 250, y_position - 15, f"{hours_formatted} × ${float(rate):.2f}")
    c.setFont("Helvetica-Bold", 11)
    c.setFillColorRGB(0, 0.5, 0)  # Green
    c.drawString(width - 150, y_position - 15, f"${float(amount):.2f}")
    
    # Total Section
    y_position -= 40
    c.setFillColorRGB(*accent_color)
    c.rect(50, y_position - 35, width - 100, 35, fill=True, stroke=False)
    
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(60, y_position - 20, "NET PAYABLE AMOUNT")
    c.setFont("Helvetica-Bold", 16)
    c.drawString(width - 180, y_position - 20, f"${float(amount):.2f}")
    
    # Footer Section
    y_position -= 80
    c.setFillColorRGB(*text_color)
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(50, y_position, "This is a computer-generated salary slip and does not require a physical signature.")
    
    # Signature Section
    y_position -= 40
    c.setFont("Helvetica", 9)
    c.drawString(50, y_position, "_" * 30)
    c.drawString(width - 200, y_position, "_" * 30)
    c.drawString(50, y_position - 15, "Employee Signature")
    c.drawString(width - 200, y_position - 15, "Authorized Signatory")
    
    # Bottom border
    c.setStrokeColorRGB(*accent_color)
    c.setLineWidth(3)
    c.line(0, 30, width, 30)
    
    # Footer text
    c.setFillColorRGB(*text_color)
    c.setFont("Helvetica", 8)
    c.drawCentredString(width / 2, 15, "© 2026 Auto Salary System. All rights reserved.")
    
    c.save()
    buffer.seek(0)
    return buffer

def send_salary_email(to_email, name, pdf_buffer, amount):
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = to_email
    msg['Subject'] = f"Salary Slip - {datetime.now().strftime('%B %Y')}"
    
    body = f"""
    Dear {name},
    
    Please find attached your salary slip for {datetime.now().strftime('%B %Y')}.
    
    Gross Salary: ${amount}
    
    Best regards,
    HR Department
    """
    msg.attach(MIMEText(body, 'plain'))
    
    part = MIMEBase('application', 'octet-stream')
    part.set_payload(pdf_buffer.getvalue())
    encoders.encode_base64(part)
    part.add_header('Content-Disposition', f'attachment; filename=Salary_{name}_{datetime.now().strftime("%Y%m")}.pdf')
    msg.attach(part)
    
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(SENDER_EMAIL, SENDER_PASSWORD)
    server.send_message(msg)
    server.quit()

@salary_bp.route('/salaries', methods=['GET'])
@jwt_required()
def get_all_salaries():
    """Get all salary records with employee names"""
    try:
        salary_records = Salary.query.order_by(Salary.generated_at.desc()).all()
        
        result = []
        for record in salary_records:
            employee_name = "Unknown"
            user = User.query.get(record.user_id)
            if user:
                employee_name = user.username
            
            result.append({
                'id': record.id,
                'user_id': record.user_id,
                'employee_id': record.employee_id,
                'employee_name': employee_name,
                'total_hours': record.total_hours,
                'hourly_rate': record.hourly_rate,
                'gross_salary': record.gross_salary,
                'period': record.period,
                'is_paid': record.is_paid,
                'paid_at': record.paid_at.isoformat() if record.paid_at else None,
                'generated_at': record.generated_at.isoformat()
            })
        
        return jsonify({'salaries': result}), 200
    except Exception as e:
        return jsonify({'msg': f'Error fetching salaries: {str(e)}'}), 500

@salary_bp.route('/salary/mark-paid/<int:salary_id>', methods=['PUT'])
@jwt_required()
@role_required('Admin', 'HR')
def mark_salary_paid(salary_id):
    """Mark a salary as paid"""
    try:
        # Find the salary record
        salary = Salary.query.get(salary_id)
        
        if not salary:
            return jsonify({'msg': f'Salary record {salary_id} not found'}), 404
        
        # Check if already paid
        if salary.is_paid:
            return jsonify({'msg': 'Salary already marked as paid'}), 400
        
        # Mark as paid
        salary.is_paid = True
        salary.paid_at = datetime.utcnow()
        db.session.commit()
        
        # Get employee/user info for response
        user = User.query.get(salary.user_id)
        
        return jsonify({
            'msg': f'Salary marked as paid for {user.username if user else "employee"}',
            'salary_id': salary.id,
            'paid_at': salary.paid_at.isoformat(),
            'is_paid': salary.is_paid
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Error marking salary as paid: {str(e)}'}), 500

@salary_bp.route('/salary', methods=['POST'])
@jwt_required()
@role_required('Admin', 'HR')
def generate_salary():
    """
    Generate salary for one or multiple employees.
    Accepts either:
    - employee_id: single employee ID (backward compatible)
    - employee_ids: array of employee IDs (bulk generation)
    """
    data = request.json or {}
    
    # Support both single and bulk generation via User ID or Employee ID
    # Priority: user_id(s) -> employee_id(s)
    
    employee_ids = data.get('employee_ids', [])
    single_employee_id = data.get('employee_id')
    
    user_ids = data.get('user_ids', [])
    single_user_id = data.get('user_id')
    
    # Normalize inputs to lists
    if single_employee_id and single_employee_id not in employee_ids:
        employee_ids.append(single_employee_id)
        
    if single_user_id and single_user_id not in user_ids:
        user_ids.append(single_user_id)
        
    # Resolve User IDs to Employee IDs
    if user_ids:
        # Find employees matching these user_ids
        employees_from_users = Employee.query.filter(Employee.user_id.in_(user_ids)).all()
        for emp in employees_from_users:
            if emp.id not in employee_ids:
                employee_ids.append(emp.id)
                
        # If some user IDs didn't match an employee record, we might want to log it or handle it
        # But for now, we process what we found.
    
    if not employee_ids:
        return jsonify({"msg": "User ID(s) or Employee ID(s) required"}), 400
    
    # Calculate current month period
    today = datetime.now()
    month_start = today.replace(day=1)
    month_end = (today.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    period_str = f"{month_start.strftime('%Y-%m')}"
    
    # Results tracking
    success_count = 0
    failed = []
    skipped = []
    generated_salaries = []
    
    # Process each employee
    for emp_id in employee_ids:
        try:
            # Find employee record
            emp = Employee.query.get(emp_id)
            if not emp:
                failed.append({
                    'employee_id': emp_id,
                    'reason': f'Employee ID {emp_id} not found'
                })
                continue
            
            # Get user info
            user = User.query.get(emp.user_id)
            if not user:
                failed.append({
                    'employee_id': emp_id,
                    'reason': f'User record not found for employee ID {emp_id}'
                })
                continue
            
            # Check for existing salary this month (UPSERT LOGIC)
            existing_salary = Salary.query.filter(
                Salary.employee_id == emp.id,
                Salary.generated_at >= month_start,
                Salary.generated_at <= month_end
            ).first()
            
            # Calculate total hours
            total_hours = db.session.query(db.func.coalesce(db.func.sum(Attendance.working_hours), 0)).filter(
                Attendance.employee_id == emp.id,
                Attendance.date >= month_start,
                Attendance.date <= month_end
            ).scalar()
            
            gross_salary = total_hours * emp.hourly_rate
            
            # UPSERT: Update if exists, Insert if not
            if existing_salary:
                # UPDATE existing salary record
                existing_salary.total_hours = total_hours
                existing_salary.hourly_rate = emp.hourly_rate
                existing_salary.gross_salary = gross_salary
                existing_salary.generated_at = datetime.now()  # Update timestamp
                salary = existing_salary
                action = "updated"
            else:
                # INSERT new salary record
                salary = Salary(
                    user_id=emp.user_id,
                    employee_id=emp.id,
                    total_hours=total_hours,
                    hourly_rate=emp.hourly_rate,
                    gross_salary=gross_salary,
                    period=period_str,  # Add period field
                    is_paid=False,
                    generated_at=datetime.now()
                )
                db.session.add(salary)
                action = "created"
            
            db.session.commit()
            
            # Try to send email (don't fail if email fails)
            email_status = "Not sent"
            try:
                pdf_buffer = generate_pdf(user.username, gross_salary, total_hours, emp.hourly_rate, salary.id, period_str)
                send_salary_email(user.email, user.username, pdf_buffer, gross_salary)
                email_status = "Sent"
            except Exception as e:
                email_status = f"Failed: {str(e)}"
            
            success_count += 1
            generated_salaries.append({
                'employee_id': emp_id,
                'employee_name': user.username,
                'salary_id': salary.id,
                'gross_salary': round(float(gross_salary), 2),
                'total_hours': round(float(total_hours), 2),
                'email_status': email_status
            })
            
        except Exception as e:
            db.session.rollback()
            failed.append({
                'employee_id': emp_id,
                'reason': str(e)
            })
    
    # Prepare response
    total_processed = len(employee_ids)
    response = {
        'msg': f'Salary generation complete: {success_count} succeeded, {len(failed)} failed, {len(skipped)} skipped',
        'total_processed': total_processed,
        'success_count': success_count,
        'failed_count': len(failed),
        'skipped_count': len(skipped),
        'period': period_str,
        'generated_salaries': generated_salaries,
        'failed': failed,
        'skipped': skipped
    }
    
    return jsonify(response), 200 if success_count > 0 else 400
