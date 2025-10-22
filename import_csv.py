"""
Import wrestler rankings from a CSV file
This is a practical alternative to web scraping.
"""
import csv
from app.database import SessionLocal
from app.models import Wrestler

def import_from_csv(csv_file='wrestlers.csv'):
    """
    Import wrestlers from a CSV file.
    
    CSV Format:
    rank,name,school,weight_class,source
    1,Spencer Lee,Iowa,125,FloWrestling
    2,Patrick Glory,Princeton,125,FloWrestling
    ...
    """
    print(f"Importing wrestlers from {csv_file}...")
    
    db = SessionLocal()
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            # Clear existing data (optional)
            existing_count = db.query(Wrestler).count()
            if existing_count > 0:
                response = input(f"Delete {existing_count} existing records? (y/n): ")
                if response.lower() == 'y':
                    db.query(Wrestler).delete()
                    db.commit()
                    print(f"✓ Cleared {existing_count} existing records")
            
            # Import new data
            added = 0
            for row in reader:
                wrestler = Wrestler(
                    rank=int(row['rank']),
                    name=row['name'],
                    school=row['school'],
                    weight_class=row['weight_class'],
                    source=row.get('source', 'CSV Import')
                )
                db.add(wrestler)
                added += 1
            
            db.commit()
            print(f"✅ Successfully imported {added} wrestlers from CSV")
            
    except FileNotFoundError:
        print(f"❌ File not found: {csv_file}")
        print("\nCreate a CSV file with this format:")
        print("rank,name,school,weight_class,source")
        print("1,Spencer Lee,Iowa,125,Manual")
        print("2,Patrick Glory,Princeton,125,Manual")
        print("...")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def create_sample_csv():
    """Create a sample CSV file"""
    sample_data = [
        ['rank', 'name', 'school', 'weight_class', 'source'],
        [1, 'Spencer Lee', 'Iowa', '125', 'Manual'],
        [1, 'Nick Suriano', 'Rutgers', '133', 'Manual'],
        [2, 'Daton Fix', 'Oklahoma State', '133', 'Manual'],
        [1, 'Austin DeSanto', 'Iowa', '141', 'Manual'],
        [2, 'Jaydin Eierman', 'Iowa', '141', 'Manual'],
        [1, 'Yianni Diakomihalis', 'Cornell', '149', 'Manual'],
        [1, 'David Carr', 'Iowa State', '157', 'Manual'],
        [1, 'Alex Marinelli', 'Iowa', '165', 'Manual'],
        [1, 'Carter Starocci', 'Penn State', '174', 'Manual'],
        [2, 'Michael Kemerer', 'Iowa', '174', 'Manual'],
        [1, 'Aaron Brooks', 'Penn State', '184', 'Manual'],
        [1, 'Myles Amine', 'Michigan', '197', 'Manual'],
        [1, 'Gable Steveson', 'Minnesota', '285', 'Manual'],
    ]
    
    with open('wrestlers_sample.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(sample_data)
    
    print("✓ Created wrestlers_sample.csv")
    print("Edit this file with your own data, then run:")
    print("  python import_csv.py")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'create':
            create_sample_csv()
        else:
            import_from_csv(sys.argv[1])
    else:
        import_from_csv()
