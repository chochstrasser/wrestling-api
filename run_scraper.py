"""
Script to run the NCAA scraper and populate the database
"""
from app.scrappers.ncaa import NCAAScraper
from app.database import SessionLocal
from app.models import Wrestler
from datetime import datetime

# Uncomment the line below to use Playwright scraper (requires: playwright install chromium)
# from app.scrappers.ncaa import PlaywrightScraper as NCAAScraper

def run_scraper():
    print("Starting NCAA Wrestling Scraper...")
    print("="*60)
    scraper = NCAAScraper()
    
    try:
        print("Fetching rankings from sources...")
        rankings = scraper.fetch_rankings()
        print(f"✓ Fetched {len(rankings)} wrestler rankings\n")
        
        if not rankings:
            print("⚠️  No rankings found from any source.")
            print("This is expected if the websites are using JavaScript rendering.")
            print("\nOptions:")
            print("1. Use the sample data: python add_sample_data.py")
            print("2. Manually add data via the API")
            print("3. Implement Selenium/Playwright for JS-rendered sites")
            return
        
        # Display sample of what was found
        print("Sample of fetched data:")
        for wrestler in rankings[:3]:
            print(f"  {wrestler['rank']}. {wrestler['name']} ({wrestler['school']}) - {wrestler['weight_class']}lbs - Source: {wrestler['source']}")
        
        if len(rankings) > 3:
            print(f"  ... and {len(rankings) - 3} more")
        
        print("\nAdding to database...")
        
        # Add to database
        db = SessionLocal()
        try:
            # Clear existing data (optional - comment out if you want to keep old data)
            existing_count = db.query(Wrestler).count()
            if existing_count > 0:
                print(f"  Clearing {existing_count} existing records...")
                db.query(Wrestler).delete()
                db.commit()
            
            # Add new rankings
            added = 0
            for item in rankings:
                wrestler = Wrestler(
                    name=item.get('name', 'Unknown'),
                    school=item.get('school', 'Unknown'),
                    weight_class=item.get('weight_class', 'Unknown'),
                    rank=item.get('rank', 0),
                    source=item.get('source', 'NCAA')
                )
                db.add(wrestler)
                added += 1
            
            db.commit()
            print(f"✅ Successfully added {added} wrestler records to database")
            
            # Verify
            final_count = db.query(Wrestler).count()
            print(f"Total wrestlers in database: {final_count}")
            
        except Exception as e:
            db.rollback()
            print(f"❌ Database error: {e}")
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Scraping error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_scraper()
