from flask import Flask, jsonify, request, abort
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import os

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)
CORS(app) 

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def __repr__(self):
        return f'<User {self.name}>'
    
    def to_dict(self):
            return {
                'id': self.id,
                'name': self.name,
                'email': self.email
            }

@app.route('/users', methods=['GET'])
def get_users():
    try:
        users = User.query.all()
        return jsonify([user.to_dict() for user in users])
    except Exception as e:
        
        print(f"Error fetching users: {e}")
        abort(500, description="Internal Server Error. Could not retrieve users.")

@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        user = User.query.get(user_id)
        if user is None:
            return jsonify({'error': f'User with ID {user_id} not found.'}), 404
        return jsonify(user.to_dict())
    except Exception as e:
        print(f"Error fetching user {user_id}: {e}")
        abort(500, description="Internal Server Error. Could not retrieve user.")

@app.route('/users', methods=['POST'])
def add_user():
    if not request.json or not 'name' in request.json or not 'email' in request.json:
        abort(400, description="Missing required fields: name and email.")

    name = request.json['name']
    email = request.json['email']

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
            return jsonify({'error': f'User with email {email} already exists.'}), 409

    try:
            new_user = User(name=name, email=email)
            db.session.add(new_user)
            db.session.commit()
            return jsonify(new_user.to_dict()), 201 
    except Exception as e:
            db.session.rollback() 
            print(f"Error adding user: {e}")
            abort(500, description="Internal Server Error. Could not add user.")


@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not Found', 'message': error.description}), 404

@app.errorhandler(400)
def bad_request_error(error):
    return jsonify({'error': 'Bad Request', 'message': error.description}), 400

@app.errorhandler(409)
def conflict_error(error):
    return jsonify({'error': 'Conflict', 'message': error.description}), 409

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal Server Error', 'message': error.description}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)