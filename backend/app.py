from flask import Flask
from flask_jwt_extended import JWTManager
from database import init_db, db
from models import User
from werkzeug.security import generate_password_hash
from datetime import timedelta

from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.employee_routes import employee_bp
from routes.attendance_routes import attendance_bp
from routes.salary_routes import salary_bp

app = Flask(__name__)
init_db(app)
jwt = JWTManager(app)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24) 

# Register ALL Blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(employee_bp, url_prefix='/api')
app.register_blueprint(attendance_bp, url_prefix='/api')
app.register_blueprint(salary_bp, url_prefix='/api')

# INIT DB + Admin User
with app.app_context():
    db.create_all()
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', password_hash=generate_password_hash('admin123'), 
                    role='Admin', email='admin@company.com')
        db.session.add(admin)
        db.session.commit()
        print("Admin created: admin / admin123")
        
@app.route('/')
def home():
    return """
    <h1> HR SALARY SYSTEM LIVE!</h1>
    <p>All APIs working perfectly!</p>
    """

if __name__ == '__main__':
    app.run(debug=True, port=5000)
