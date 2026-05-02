from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db, User, Role, Feature, DEFAULT_ROLES, SEED_FEATURES
from routes import auth_bp, users_bp, roles_bp, providers_bp, features_bp
from datetime import timedelta

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['JWT_SECRET_KEY'] = 'change-this-to-a-strong-secret-key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

CORS(app, supports_credentials=True)
JWTManager(app)
db.init_app(app)

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(roles_bp, url_prefix='/api/roles')
app.register_blueprint(providers_bp, url_prefix='/api/providers')
app.register_blueprint(features_bp, url_prefix='/api/features')

ROLE_DESCRIPTIONS = {
    'admin': 'Full system access',
    'manager': 'User management access',
    'user': 'Basic access',
    'member': 'App user with standard access',
    'provider': 'Service provider with shop access'
}

with app.app_context():
    db.create_all()
    for r in DEFAULT_ROLES:
        existing = Role.query.filter_by(name=r).first()
        if not existing:
            db.session.add(Role(name=r, description=ROLE_DESCRIPTIONS[r], is_system=True))
        elif not existing.description:
            existing.description = ROLE_DESCRIPTIONS[r]
    if Feature.query.count() == 0:
        for svc_type, names in SEED_FEATURES.items():
            for name in names:
                db.session.add(Feature(name=name, service_type=svc_type))
    db.session.commit()
    if not User.query.filter_by(role='admin').first():
        admin = User(email='admin@app.com', name='Admin', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print('Default admin created: admin@app.com / admin123')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
