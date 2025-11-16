"""
Flask web application for Reservoir Dog
"""
from flask import Flask, render_template, jsonify, send_from_directory, request
from sqlalchemy import desc
from datetime import datetime, timedelta
from database import ReservoirData, Deployment, SessionLocal, init_db
import config
import os
import subprocess

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')


@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html', reservoirs=config.RESERVOIRS)


@app.route('/api/reservoirs')
def get_reservoirs():
    """API endpoint to get list of reservoirs"""
    return jsonify(config.RESERVOIRS)


@app.route('/api/reservoir/<reservoir_code>/latest')
def get_latest_data(reservoir_code):
    """Get latest data for a reservoir"""
    db = SessionLocal()
    try:
        latest = db.query(ReservoirData).filter(
            ReservoirData.reservoir_code == reservoir_code
        ).order_by(desc(ReservoirData.timestamp)).first()
        
        if not latest:
            return jsonify({'error': 'No data found'}), 404
        
        return jsonify({
            'reservoir_code': latest.reservoir_code,
            'timestamp': latest.timestamp.isoformat(),
            'reservoir_elevation': latest.reservoir_elevation,
            'storage': latest.storage,
            'storage_percent': latest.storage_percent,
            'data_source': latest.data_source
        })
    finally:
        db.close()


@app.route('/api/reservoir/<reservoir_code>/data')
def get_reservoir_data(reservoir_code):
    """Get time-series data for a reservoir"""
    db = SessionLocal()
    try:
        # Get query parameters
        days = int(request.args.get('days', 30))
        start_date = datetime.utcnow() - timedelta(days=days)
        
        data_points = db.query(ReservoirData).filter(
            ReservoirData.reservoir_code == reservoir_code,
            ReservoirData.timestamp >= start_date
        ).order_by(ReservoirData.timestamp).all()
        
        return jsonify({
            'reservoir_code': reservoir_code,
            'data': [{
                'timestamp': d.timestamp.isoformat(),
                'reservoir_elevation': d.reservoir_elevation,
                'storage': d.storage,
                'storage_percent': d.storage_percent
            } for d in data_points]
        })
    finally:
        db.close()


@app.route('/api/reservoir/<reservoir_code>/stats')
def get_reservoir_stats(reservoir_code):
    """Get statistics for a reservoir"""
    db = SessionLocal()
    try:
        # Get last 365 days of data
        start_date = datetime.utcnow() - timedelta(days=365)
        data_points = db.query(ReservoirData).filter(
            ReservoirData.reservoir_code == reservoir_code,
            ReservoirData.timestamp >= start_date
        ).all()
        
        if not data_points:
            return jsonify({'error': 'No data found'}), 404
        
        storages = [d.storage for d in data_points if d.storage]
        elevations = [d.reservoir_elevation for d in data_points if d.reservoir_elevation]
        
        return jsonify({
            'reservoir_code': reservoir_code,
            'current': {
                'storage': data_points[-1].storage if data_points else None,
                'elevation': data_points[-1].reservoir_elevation if data_points else None,
                'timestamp': data_points[-1].timestamp.isoformat() if data_points else None
            },
            'stats': {
                'min_storage': min(storages) if storages else None,
                'max_storage': max(storages) if storages else None,
                'avg_storage': sum(storages) / len(storages) if storages else None,
                'min_elevation': min(elevations) if elevations else None,
                'max_elevation': max(elevations) if elevations else None,
                'avg_elevation': sum(elevations) / len(elevations) if elevations else None,
            },
            'data_points': len(data_points)
        })
    finally:
        db.close()


@app.route('/images/<path:filename>')
def serve_image(filename):
    """Serve images from references/images directory"""
    return send_from_directory(
        os.path.join(os.path.dirname(__file__), 'references', 'images'),
        filename
    )


def record_deployment(environment, commit_sha=None, commit_message=None, branch=None, deployed_by='manual'):
    """Record a deployment in the database"""
    try:
        # Get git info if not provided
        if not commit_sha:
            commit_sha = subprocess.check_output(
                ['git', 'rev-parse', 'HEAD'], 
                cwd=os.path.dirname(__file__)
            ).decode('utf-8').strip()
        
        if not commit_message:
            commit_message = subprocess.check_output(
                ['git', 'log', '-1', '--pretty=%B'],
                cwd=os.path.dirname(__file__)
            ).decode('utf-8').strip()
        
        if not branch:
            branch = subprocess.check_output(
                ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                cwd=os.path.dirname(__file__)
            ).decode('utf-8').strip()
        
        db = SessionLocal()
        try:
            deployment = Deployment(
                environment=environment,
                commit_sha=commit_sha[:40],  # Ensure SHA is max 40 chars
                commit_message=commit_message[:500] if commit_message else None,
                branch=branch,
                deployed_by=deployed_by
            )
            db.add(deployment)
            db.commit()
            db.refresh(deployment)
            return deployment
        finally:
            db.close()
    except Exception as e:
        print(f"Error recording deployment: {e}")
        return None


@app.route('/deployments')
def deployments():
    """Deployments page showing deployment history"""
    db = SessionLocal()
    try:
        # Get all deployments, ordered by most recent first
        all_deployments = db.query(Deployment).order_by(desc(Deployment.deployed_at)).all()
        
        # Group by environment
        dev_deployments = [d for d in all_deployments if d.environment == 'dev']
        prod_deployments = [d for d in all_deployments if d.environment == 'prod']
        
        return render_template('deployments.html', 
                             dev_deployments=dev_deployments,
                             prod_deployments=prod_deployments,
                             environment=config.ENVIRONMENT)
    finally:
        db.close()


@app.route('/api/deployments')
def get_deployments():
    """API endpoint to get deployment history"""
    db = SessionLocal()
    try:
        limit = int(request.args.get('limit', 50))
        environment = request.args.get('environment')
        
        query = db.query(Deployment)
        if environment:
            query = query.filter(Deployment.environment == environment)
        
        deployments = query.order_by(desc(Deployment.deployed_at)).limit(limit).all()
        
        return jsonify({
            'deployments': [{
                'id': d.id,
                'environment': d.environment,
                'deployed_at': d.deployed_at.isoformat(),
                'commit_sha': d.commit_sha,
                'commit_message': d.commit_message,
                'branch': d.branch,
                'deployed_by': d.deployed_by,
                'version': d.version
            } for d in deployments]
        })
    finally:
        db.close()


if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Run the app
    app.run(
        host=config.FLASK_HOST,
        port=config.FLASK_PORT,
        debug=config.FLASK_DEBUG
    )

