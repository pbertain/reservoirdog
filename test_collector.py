#!/usr/bin/env python3
"""
Test script for data collection
"""
from collector import ReservoirCollector
from database import init_db
import sys

def test_collection():
    """Test data collection for all reservoirs"""
    print("Initializing database...")
    init_db()
    
    print("\nTesting data collection...")
    collector = ReservoirCollector()
    
    reservoirs = ['BER', 'ORO']
    results = {}
    
    for code in reservoirs:
        print(f"\n{'='*60}")
        print(f"Testing {code}...")
        print('='*60)
        
        try:
            data = collector.collect_cdec_query(code)
            if data:
                timestamp, res_ele, storage = data
                print(f"✓ Successfully collected data for {code}")
                print(f"  Timestamp: {timestamp}")
                print(f"  Elevation: {res_ele} feet")
                print(f"  Storage: {storage:,} acre-feet")
                
                # Try to save
                saved = collector.save_data(code, timestamp, res_ele, storage)
                if saved:
                    print(f"  ✓ Data saved to database (ID: {saved.id})")
                else:
                    print(f"  ✗ Failed to save data")
                
                results[code] = data
            else:
                print(f"✗ Failed to collect data for {code}")
                results[code] = None
        except Exception as e:
            print(f"✗ Error collecting data for {code}: {e}")
            results[code] = None
    
    print(f"\n{'='*60}")
    print("Summary:")
    print('='*60)
    for code, result in results.items():
        status = "✓ SUCCESS" if result else "✗ FAILED"
        print(f"{code}: {status}")
    
    return results

if __name__ == '__main__':
    try:
        results = test_collection()
        # Exit with error code if any collection failed
        if any(r is None for r in results.values()):
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

