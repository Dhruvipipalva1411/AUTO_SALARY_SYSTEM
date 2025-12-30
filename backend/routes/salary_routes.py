from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Salary, Employee, Attendance, User
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import io

salary_bp = Blueprint('salary', __name__)

SENDER_EMAIL = "pipalva03@gmail.com"           
SENDER_PASSWORD = "bitx nijy dsea fikd"

def generate_pdf(name, amount, hours, rate, salary_id, period):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    p.setFillColorRGB(0.2, 0.4, 0.8)  
    p.rect(0.5*inch, height-1.2*inch, 7*inch, 0.8*inch, fill=1)
    p.setFillColorRGB(1,1,1) 
    p.setFont("Helvetica-Bold", 24)
    p.drawCentredString(width/2, height-0.9*inch, "SALARY RECEIPT")  
    p.setFont("Helvetica-Bold", 14)
    p.drawCentredString(width/2, height-1.1*inch, "PAYROLL DEPARTMENT")  
    
    p.setStrokeColorRGB(1,1,1)
    p.setLineWidth(3)
    p.line(1*inch, height-1.3*inch, width-1*inch, height-1.3*inch)
    
    p.setFont("Helvetica-Bold", 16)
    p.setFillColorRGB(0,0,0)
    p.drawString(1*inch, height-2*inch, "EMPLOYEE DETAILS")
    
    p.setFont("Helvetica", 12)
    p.drawString(1.2*inch, height-2.4*inch, f"Name: {name.upper()}")
    p.drawString(1.2*inch, height-2.7*inch, f"Salary ID: #{salary_id}")
    p.drawString(1.2*inch, height-3*inch, f"Period: {period}")
    
    p.setFont("Helvetica-Bold", 16)
    p.drawString(4.5*inch, height-2*inch, "PAYMENT BREAKDOWN")
    
    p.setFillColorRGB(0.9, 0.9, 0.9)
    p.rect(4.5*inch, height-2.4*inch, 2.8*inch, 0.3*inch, fill=1)
    p.setFillColorRGB(0,0,0)
    p.setFont("Helvetica-Bold", 11)
    p.drawString(4.6*inch, height-2.25*inch, "Description")
    p.drawString(6.8*inch, height-2.25*inch, "Amount")
    
    p.setFont("Helvetica", 11)
    p.drawString(4.6*inch, height-2.6*inch, "Total Hours")
    p.drawRightString(7.2*inch, height-2.6*inch, f"{hours:.2f} hrs")
    
    p.drawString(4.6*inch, height-2.85*inch, "Hourly Rate")
    p.drawRightString(7.2*inch, height-2.85*inch, f"${rate:.2f}")
    
    p.setStrokeColorRGB(0.8, 0.2, 0.2)  
    p.setLineWidth(2)
    p.line(4.5*inch, height-3.2*inch, 7.2*inch, height-3.2*inch)
    
    p.setFont("Helvetica-Bold", 14)
    p.setFillColorRGB(0.8, 0.2, 0.2)
    p.drawString(4.6*inch, height-3.45*inch, "GROSS SALARY")
    p.drawRightString(7.2*inch, height-3.45*inch, f"${amount:.2f}")
    
    p.setFont("Helvetica", 9)
    p.setFillColorRGB(0.5, 0.5, 0.5)
    p.drawCentredString(width/2, 1.2*inch, f"Generated: {datetime.now().strftime('%d %B %Y at %I:%M %p')}")  
    p.drawCentredString(width/2, 0.9*inch, "This is a computer-generated receipt.") 
    p.drawCentredString(width/2, 0.6*inch, "Thank you for your contribution to the team!")  
    
    p.setFont("Helvetica-Bold", 10)
    p.drawString(1*inch, 0.3*inch, "HR DEPARTMENT")
    p.setFont("Helvetica", 8)
    p.drawString(1*inch, 0.1*inch, "Auto Salary System")
    
    p.save()
    buffer.seek(0)
    return buffer


def send_salary_email(to_email, name, pdf_buffer, amount):
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = to_email
    msg['Subject'] = f"Salary Receipt ${amount:.2f}"
    
    body = f"Dear {name},\n\nPlease find attached your salary receipt.\n\nAmount: ${amount:.2f}\n\nThank you!\nHR Team"
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

@salary_bp.route('/salary', methods=['POST'])
@jwt_required()
def generate_salary():
    identity = get_jwt_identity()
    user_id = int(identity)
    current_user = User.query.get(user_id)
    
    if current_user.role not in ['Admin', 'HR']:
        return jsonify({'msg': 'Only Admin/HR can generate salary'}), 403
    
    data = request.json
    emp_id = data.get('employee_id')
    if not emp_id:
        return jsonify({'msg': 'employee_id required'}), 400
    
    emp = Employee.query.get(emp_id)
    if not emp:
        return jsonify({'msg': 'Employee not found'}), 404
    
    emp_user_id = emp.user_id
    
    today = datetime.now()
    month_start = today.replace(day=1)
    month_end = (today.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    
    total_hours = db.session.query(db.func.coalesce(db.func.sum(Attendance.working_hours), 0)).filter(
        Attendance.employee_id == emp_id,
        Attendance.date >= month_start,
        Attendance.date <= month_end
    ).scalar() or 0
    
    gross_salary = total_hours * emp.hourly_rate
    
    salary = Salary(
        user_id=emp_user_id,
        employee_id=emp_id,
        total_hours=total_hours,
        hourly_rate=emp.hourly_rate,
        gross_salary=gross_salary,
        generated_at=datetime.now()
    )
    db.session.add(salary)
    db.session.commit()
    
    user = User.query.get(emp_user_id)
    
    period_str = f"{month_start.strftime('%Y-%m')} to {month_end.strftime('%Y-%m')}"
    pdf_buffer = generate_pdf(user.username, gross_salary, total_hours, emp.hourly_rate, salary.id, period_str)
    
    try:
        send_salary_email(user.email, user.username, pdf_buffer, gross_salary)
        email_status = "EMAIL and PDF SENT!"
    except Exception as e:
        email_status = f"Email failed: {str(e)}"
    
    return jsonify({
        'msg': 'Salary generated + PDF emailed successfully!',
        'salary_id': salary.id,
        'employee': user.username,
        'period': period_str,
        'total_hours': round(float(total_hours), 2),
        'hourly_rate': float(emp.hourly_rate),
        'gross_salary': round(float(gross_salary), 2),
        'email_status': email_status
    })
