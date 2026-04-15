from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from database import init_db, db
from models import User
from werkzeug.security import generate_password_hash
from datetime import timedelta

from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.employee_routes import employee_bp
from routes.attendance_routes import attendance_bp
from routes.salary_routes import salary_bp
from routes.dashboard_routes import dashboard_bp

app = Flask(__name__)
init_db(app)
jwt = JWTManager(app)
CORS(app)  # Enable CORS for frontend communication
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24) 

# Register ALL Blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(employee_bp, url_prefix='/api')
app.register_blueprint(attendance_bp, url_prefix='/api')
app.register_blueprint(salary_bp, url_prefix='/api')
app.register_blueprint(dashboard_bp, url_prefix='/api')

# INIT DB + Admin User
with app.app_context():
    db.create_all()
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', password_hash=generate_password_hash('admin123'), 
                    role='Admin', email='admin@company.com')
        db.session.add(admin)
        db.session.commit()
        print("Admin created: admin / admin123")

# Initialize scheduler for automated tasks (auto-checkout at 7:00 PM)
try:
    from scheduler import init_scheduler
    scheduler = init_scheduler()
    print("✅ Scheduler initialized - Auto-checkout will run at 7:00 PM daily")
except ImportError:
    print("⚠️  APScheduler not installed. Run: pip install apscheduler")
    print("   Auto-checkout feature will not work without it.")
except Exception as e:
    print(f"⚠️  Scheduler initialization failed: {str(e)}")

# Self-healing: Fix missing employee records on startup
with app.app_context():
    try:
        from models import Employee
        # Find all users with role 'Employee'
        users = User.query.filter_by(role='Employee').all()
        fixed_count = 0
        for user in users:
            # Check if employee record exists
            emp = Employee.query.filter_by(user_id=user.id).first()
            if not emp:
                print(f"🔧 Fixing missing employee record for user: {user.username} (ID: {user.id})")
                new_emp = Employee(
                    user_id=user.id,
                    hourly_rate=15.00,
                    company_closing_time='18:00:00'
                )
                db.session.add(new_emp)
                fixed_count += 1
        
        if fixed_count > 0:
            db.session.commit()
            print(f"✅ Automatically created {fixed_count} missing employee records")
    except Exception as e:
        print(f"⚠️  Error in self-healing check: {str(e)}")
        
@app.route('/')
def home():
    return """
    <h1>HR SALARY SYSTEM LIVE!</h1>
    <p>All APIs working perfectly!</p>
    """

if __name__ == '__main__':
    app.run(debug=True, port=5000)
