from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json

db = SQLAlchemy()

DEFAULT_ROLES = ['admin', 'manager', 'user', 'member', 'provider']

SEED_FEATURES = {
    'car': [
        'General Service', 'Oil Change', 'AC Service & Repair',
        'Wheel Alignment & Balancing', 'Brake Pad Replacement',
        'Battery Replacement', 'Denting & Painting',
        'Car Wash & Detailing', 'Clutch Repair',
        'Insurance Claim Assistance', 'Towing Service'
    ],
    'bike': [
        'General Service', 'Engine Tune-up', 'Oil Change',
        'Chain Cleaning & Lubrication', 'Brake Adjustment',
        'Tyre Replacement', 'Battery Replacement',
        'Electrical Repair', 'Full Body Wash',
        'Clutch Plate Replacement', 'Puncture Repair'
    ]
}


class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200), default='')
    is_system = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_system': self.is_system,
            'created_at': self.created_at.isoformat()
        }


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(15), default='')
    name = db.Column(db.String(100), default='')
    password_hash = db.Column(db.String(256), nullable=True)
    role = db.Column(db.String(50), nullable=False, default='member')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    location = db.relationship('Location', backref='user', uselist=False, cascade='all, delete-orphan')
    provider = db.relationship('ServiceProvider', backref='user', uselist=False, cascade='all, delete-orphan')

    @property
    def has_password(self):
        return self.password_hash is not None

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        d = {
            'id': self.id,
            'email': self.email,
            'phone': self.phone,
            'name': self.name,
            'role': self.role,
            'is_active': self.is_active,
            'has_password': self.has_password,
            'created_at': self.created_at.isoformat(),
            'location': self.location.to_dict() if self.location else None,
            'provider': self.provider.to_dict() if self.provider else None
        }
        return d


class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    country = db.Column(db.String(50), default='India')
    state = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    taluk = db.Column(db.String(100), default='')
    village = db.Column(db.String(100), default='')

    def to_dict(self):
        return {
            'country': self.country,
            'state': self.state,
            'district': self.district,
            'taluk': self.taluk,
            'village': self.village
        }


class ServiceProvider(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    shop_name = db.Column(db.String(150), nullable=False)
    whatsapp = db.Column(db.String(15), nullable=False)
    address = db.Column(db.Text, nullable=False)
    state = db.Column(db.String(100), default='')
    district = db.Column(db.String(100), default='')
    taluk = db.Column(db.String(100), default='')
    pincode = db.Column(db.String(10), default='')
    services_json = db.Column(db.Text, default='[]')
    features_json = db.Column(db.Text, default='[]')
    timings_json = db.Column(db.Text, default='{}')
    pricing_json = db.Column(db.Text, default='{}')
    show_prices = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def services(self):
        return json.loads(self.services_json) if self.services_json else []

    @services.setter
    def services(self, val):
        self.services_json = json.dumps(val)

    @property
    def features(self):
        return json.loads(self.features_json) if self.features_json else []

    @features.setter
    def features(self, val):
        self.features_json = json.dumps(val)

    @property
    def timings(self):
        return json.loads(self.timings_json) if self.timings_json else {}

    @timings.setter
    def timings(self, val):
        self.timings_json = json.dumps(val)

    @property
    def pricing(self):
        return json.loads(self.pricing_json) if self.pricing_json else {}

    @pricing.setter
    def pricing(self, val):
        self.pricing_json = json.dumps(val)

    def to_dict(self):
        return {
            'id': self.id,
            'shop_name': self.shop_name,
            'whatsapp': self.whatsapp,
            'address': self.address,
            'state': self.state,
            'district': self.district,
            'taluk': self.taluk,
            'pincode': self.pincode,
            'services': self.services,
            'features': self.features,
            'timings': self.timings,
            'pricing': self.pricing,
            'show_prices': self.show_prices,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat()
        }


class Feature(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    service_type = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'service_type': self.service_type,
            'created_at': self.created_at.isoformat()
        }
