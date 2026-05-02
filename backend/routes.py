from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from models import db, User, Role, Location, ServiceProvider, Feature

auth_bp = Blueprint('auth', __name__)
users_bp = Blueprint('users', __name__)
roles_bp = Blueprint('roles', __name__)
providers_bp = Blueprint('providers', __name__)
features_bp = Blueprint('features', __name__)


def role_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorated(*args, **kwargs):
            user = User.query.get(get_jwt_identity())
            if not user or user.role not in roles:
                return jsonify(msg='Forbidden'), 403
            return fn(*args, **kwargs)
        return decorated
    return wrapper


def valid_role(name):
    return Role.query.filter_by(name=name).first() is not None


def upsert_location(user, loc_data):
    if not loc_data or not loc_data.get('state') or not loc_data.get('district'):
        return
    if user.location:
        user.location.state = loc_data['state']
        user.location.district = loc_data['district']
        user.location.taluk = loc_data.get('taluk', '')
        user.location.village = loc_data.get('village', '')
    else:
        loc = Location(
            user_id=user.id,
            state=loc_data['state'],
            district=loc_data['district'],
            taluk=loc_data.get('taluk', ''),
            village=loc_data.get('village', '')
        )
        db.session.add(loc)


# --- Auth ---

@auth_bp.post('/register')
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('phone'):
        return jsonify(msg='Email and phone number are required'), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify(msg='Email already exists'), 409
    user = User(email=data['email'], phone=data['phone'], name=data.get('name', ''), role='member')
    if data.get('password'):
        user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()
    if data.get('location'):
        upsert_location(user, data['location'])
    db.session.commit()
    return jsonify(msg='Registered successfully', user=user.to_dict()), 201


@auth_bp.post('/login')
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if not user:
        return jsonify(msg='Invalid credentials'), 401
    if not user.has_password:
        return jsonify(msg='Use member login for this account'), 403
    if user.role == 'member':
        return jsonify(msg='Use member login for this account'), 403
    if not user.check_password(data.get('password', '')):
        return jsonify(msg='Invalid credentials'), 401
    if not user.is_active:
        return jsonify(msg='Account disabled'), 403
    access = create_access_token(identity=str(user.id))
    refresh = create_refresh_token(identity=str(user.id))
    return jsonify(access_token=access, refresh_token=refresh, user=user.to_dict())


@auth_bp.post('/member-login')
def member_login():
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify(msg='Email is required'), 400
    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify(msg='Account not found. Please register first.'), 404
    if user.role != 'member':
        return jsonify(msg='Use admin/staff login for this account'), 403
    if not user.is_active:
        return jsonify(msg='Account disabled'), 403
    access = create_access_token(identity=str(user.id))
    refresh = create_refresh_token(identity=str(user.id))
    return jsonify(access_token=access, refresh_token=refresh, user=user.to_dict())


@auth_bp.post('/refresh')
@jwt_required(refresh=True)
def refresh():
    access = create_access_token(identity=get_jwt_identity())
    return jsonify(access_token=access)


@auth_bp.get('/me')
@jwt_required()
def me():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify(msg='Not found'), 404
    return jsonify(user=user.to_dict())


# --- User Management ---

@users_bp.get('/')
@role_required('admin', 'manager')
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify(users=[u.to_dict() for u in users])


@users_bp.post('/')
@role_required('admin')
def create_user():
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify(msg='Email is required'), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify(msg='Email already exists'), 409
    role_name = data.get('role', 'member')
    if not valid_role(role_name):
        return jsonify(msg='Invalid role'), 400
    user = User(email=data['email'], phone=data.get('phone', ''), name=data.get('name', ''), role=role_name)
    if data.get('password'):
        user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()
    if data.get('location'):
        upsert_location(user, data['location'])
    db.session.commit()
    return jsonify(msg='User created', user=user.to_dict()), 201


@users_bp.put('/<int:uid>')
@role_required('admin')
def update_user(uid):
    user = User.query.get_or_404(uid)
    data = request.get_json()
    if 'role' in data:
        if not valid_role(data['role']):
            return jsonify(msg='Invalid role'), 400
        user.role = data['role']
    if 'phone' in data:
        user.phone = data['phone']
    if 'name' in data:
        user.name = data['name']
    if 'is_active' in data:
        user.is_active = bool(data['is_active'])
    if 'password' in data and data['password']:
        user.set_password(data['password'])
    if 'location' in data:
        upsert_location(user, data['location'])
    db.session.commit()
    return jsonify(user=user.to_dict())


@users_bp.delete('/<int:uid>')
@role_required('admin')
def delete_user(uid):
    user = User.query.get_or_404(uid)
    db.session.delete(user)
    db.session.commit()
    return jsonify(msg='Deleted')


@users_bp.put('/me/location')
@jwt_required()
def update_my_location():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify(msg='Not found'), 404
    data = request.get_json()
    if not data or not data.get('state') or not data.get('district'):
        return jsonify(msg='State and district are required'), 400
    upsert_location(user, data)
    db.session.commit()
    return jsonify(user=user.to_dict())


# --- Service Provider ---

@providers_bp.get('/features')
def get_features():
    feats = Feature.query.order_by(Feature.name).all()
    result = {}
    for f in feats:
        result.setdefault(f.service_type, []).append(f.name)
    return jsonify(features=result)


@providers_bp.post('/register')
def register_provider():
    data = request.get_json()
    required = ['shop_name', 'owner_name', 'email', 'whatsapp', 'address', 'state', 'district', 'services']
    if not data or not all(data.get(k) for k in required):
        return jsonify(msg='All fields are required: shop name, owner name, email, whatsapp, address, state, district, services'), 400
    if not isinstance(data['services'], list) or not data['services']:
        return jsonify(msg='Select at least one service (car/bike)'), 400
    existing = User.query.filter_by(email=data['email']).first()
    if existing and existing.provider:
        return jsonify(msg='This email is already registered as a provider'), 409
    if existing:
        user = existing
        user.role = 'provider'
        user.name = data['owner_name']
        user.phone = data.get('phone', user.phone)
    else:
        user = User(email=data['email'], phone=data.get('phone', ''), name=data['owner_name'], role='provider')
        db.session.add(user)
    db.session.flush()
    provider = ServiceProvider(
        user_id=user.id,
        shop_name=data['shop_name'],
        whatsapp=data['whatsapp'],
        address=data['address'],
        state=data['state'],
        district=data['district'],
        taluk=data.get('taluk', ''),
        pincode=data.get('pincode', ''),
    )
    provider.services = data['services']
    provider.features = data.get('features', [])
    provider.timings = data.get('timings', {})
    provider.pricing = data.get('pricing', {})
    if 'show_prices' in data:
        provider.show_prices = bool(data['show_prices'])
    db.session.add(provider)
    db.session.commit()
    return jsonify(msg='Provider registered successfully', user=user.to_dict()), 201


@providers_bp.get('/')
@role_required('admin', 'manager')
def list_providers():
    users = User.query.filter_by(role='provider').order_by(User.created_at.desc()).all()
    return jsonify(providers=[u.to_dict() for u in users])


@providers_bp.get('/search')
@jwt_required()
def search_providers():
    svc_type = request.args.get('service')
    state = request.args.get('state', '')
    district = request.args.get('district', '')
    taluk = request.args.get('taluk', '')
    if not svc_type:
        return jsonify(msg='Service type is required'), 400
    query = ServiceProvider.query.filter(ServiceProvider.is_verified == True)
    if state:
        query = query.filter(ServiceProvider.state == state)
    if district:
        query = query.filter(ServiceProvider.district == district)
    if taluk:
        query = query.filter(ServiceProvider.taluk == taluk)
    providers = query.order_by(ServiceProvider.shop_name).all()
    results = []
    for p in providers:
        if svc_type in p.services:
            d = p.to_dict()
            d['owner_name'] = p.user.name
            d['owner_email'] = p.user.email
            d['owner_phone'] = p.user.phone
            if not p.show_prices:
                d.pop('pricing', None)
            results.append(d)
    return jsonify(providers=results)


@providers_bp.get('/<int:pid>/detail')
def get_provider_detail(pid):
    provider = ServiceProvider.query.get_or_404(pid)
    d = provider.to_dict()
    d['owner_name'] = provider.user.name
    d['owner_email'] = provider.user.email
    d['owner_phone'] = provider.user.phone
    if not provider.show_prices:
        d.pop('pricing', None)
    return jsonify(provider=d)


@providers_bp.put('/<int:pid>')
@role_required('admin')
def update_provider(pid):
    provider = ServiceProvider.query.get_or_404(pid)
    data = request.get_json()
    for field in ['shop_name', 'whatsapp', 'address', 'state', 'district', 'taluk', 'pincode']:
        if field in data:
            setattr(provider, field, data[field])
    if 'services' in data:
        provider.services = data['services']
    if 'features' in data:
        provider.features = data['features']
    if 'timings' in data:
        provider.timings = data['timings']
    if 'pricing' in data:
        provider.pricing = data['pricing']
    if 'show_prices' in data:
        provider.show_prices = bool(data['show_prices'])
    if 'is_verified' in data:
        provider.is_verified = bool(data['is_verified'])
    db.session.commit()
    return jsonify(provider=provider.to_dict())


# --- Role Management ---

@roles_bp.get('/')
@jwt_required()
def list_roles():
    roles = Role.query.order_by(Role.name).all()
    return jsonify(roles=[r.to_dict() for r in roles])


@roles_bp.post('/')
@role_required('admin')
def create_role():
    data = request.get_json()
    name = data.get('name', '').strip().lower()
    if not name:
        return jsonify(msg='Role name required'), 400
    if Role.query.filter_by(name=name).first():
        return jsonify(msg='Role already exists'), 409
    role = Role(name=name, description=data.get('description', ''))
    db.session.add(role)
    db.session.commit()
    return jsonify(msg='Role created', role=role.to_dict()), 201


@roles_bp.put('/<int:rid>')
@role_required('admin')
def update_role(rid):
    role = Role.query.get_or_404(rid)
    if role.is_system:
        return jsonify(msg='Cannot modify system roles'), 403
    data = request.get_json()
    if 'description' in data:
        role.description = data['description']
    if 'name' in data:
        new_name = data['name'].strip().lower()
        if new_name and new_name != role.name:
            if Role.query.filter_by(name=new_name).first():
                return jsonify(msg='Role name already exists'), 409
            old_name = role.name
            role.name = new_name
            User.query.filter_by(role=old_name).update({'role': new_name})
    db.session.commit()
    return jsonify(role=role.to_dict())


@roles_bp.delete('/<int:rid>')
@role_required('admin')
def delete_role(rid):
    role = Role.query.get_or_404(rid)
    if role.is_system:
        return jsonify(msg='Cannot delete system roles'), 403
    if User.query.filter_by(role=role.name).count() > 0:
        return jsonify(msg='Role is in use, reassign users first'), 409
    db.session.delete(role)
    db.session.commit()
    return jsonify(msg='Deleted')


# --- Feature Management ---

@features_bp.get('/')
@jwt_required()
def list_features():
    feats = Feature.query.order_by(Feature.service_type, Feature.name).all()
    return jsonify(features=[f.to_dict() for f in feats])


@features_bp.post('/')
@role_required('admin')
def create_feature():
    data = request.get_json()
    name = data.get('name', '').strip()
    svc_type = data.get('service_type', '').strip().lower()
    if not name or svc_type not in ('car', 'bike'):
        return jsonify(msg='Name and service type (car/bike) are required'), 400
    if Feature.query.filter_by(name=name, service_type=svc_type).first():
        return jsonify(msg='Feature already exists for this service type'), 409
    feat = Feature(name=name, service_type=svc_type)
    db.session.add(feat)
    db.session.commit()
    return jsonify(msg='Feature created', feature=feat.to_dict()), 201


@features_bp.put('/<int:fid>')
@role_required('admin')
def update_feature(fid):
    feat = Feature.query.get_or_404(fid)
    data = request.get_json()
    if 'name' in data:
        feat.name = data['name'].strip()
    if 'service_type' in data and data['service_type'] in ('car', 'bike'):
        feat.service_type = data['service_type']
    db.session.commit()
    return jsonify(feature=feat.to_dict())


@features_bp.delete('/<int:fid>')
@role_required('admin')
def delete_feature(fid):
    feat = Feature.query.get_or_404(fid)
    db.session.delete(feat)
    db.session.commit()
    return jsonify(msg='Deleted')
