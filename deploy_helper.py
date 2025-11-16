#!/usr/bin/env python3
"""
Helper script to record deployments
Can be called from deployment scripts or GitHub Actions
"""
import sys
import os
from database import init_db, Deployment, SessionLocal
from datetime import datetime

def record_deployment(environment, commit_sha=None, commit_message=None, branch=None, deployed_by='manual'):
    """Record a deployment in the database"""
    import subprocess
    
    # Initialize database
    init_db()
    
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
                commit_sha=commit_sha[:40],
                commit_message=commit_message[:500] if commit_message else None,
                branch=branch,
                deployed_by=deployed_by
            )
            db.add(deployment)
            db.commit()
            db.refresh(deployment)
            print(f"✓ Recorded deployment: {environment} - {commit_sha[:7]} - {deployment.id}")
            return deployment
        finally:
            db.close()
    except Exception as e:
        print(f"✗ Error recording deployment: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return None

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python deploy_helper.py <environment> [commit_sha] [commit_message] [branch] [deployed_by]")
        print("Example: python deploy_helper.py dev")
        sys.exit(1)
    
    environment = sys.argv[1]
    commit_sha = sys.argv[2] if len(sys.argv) > 2 else None
    commit_message = sys.argv[3] if len(sys.argv) > 3 else None
    branch = sys.argv[4] if len(sys.argv) > 4 else None
    deployed_by = sys.argv[5] if len(sys.argv) > 5 else 'manual'
    
    result = record_deployment(environment, commit_sha, commit_message, branch, deployed_by)
    sys.exit(0 if result else 1)

