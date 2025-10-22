import requests
from bs4 import BeautifulSoup
import json

class NCAAScraper:
    """
    Scraper for NCAA wrestling rankings.
    Note: Many wrestling sites use JavaScript rendering.
    This implementation tries multiple sources and fallback strategies.
    For JS-rendered sites, use the PlaywrightScraper class below.
    """
    
    # Weight classes for NCAA Division I wrestling
    WEIGHT_CLASSES = ["125", "133", "141", "149", "157", "165", "174", "184", "197", "285"]
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
    
    def fetch_rankings(self):
        """
        Fetch wrestler rankings from multiple sources.
        Returns a list of wrestler dictionaries with rank, name, school, weight_class, and source.
        """
        wrestlers = []
        
        # Try FloWrestling API endpoint (if they have one)
        try:
            flow_wrestlers = self._fetch_flowrestling_api()
            if flow_wrestlers:
                wrestlers.extend(flow_wrestlers)
                return wrestlers
        except Exception as e:
            print(f"FloWrestling API failed: {e}")
        
        # Try NCAA.com
        try:
            ncaa_wrestlers = self._fetch_ncaa_rankings()
            if ncaa_wrestlers:
                wrestlers.extend(ncaa_wrestlers)
                return wrestlers
        except Exception as e:
            print(f"NCAA.com failed: {e}")
        
        # If all sources fail, return empty list
        print("All ranking sources failed.")
        return wrestlers
    
    def _fetch_flowrestling_api(self):
        """
        Fetch from FloWrestling API - they have a JSON API for rankings
        """
        wrestlers = []
        
        # FloWrestling's actual API endpoint (found in their page source)
        # This gets the 2025-26 NCAA DI rankings
        api_url = "https://api.flowrestling.org/api/experiences/web/legacy-core/ranking-containers/14300895?site_id=2"
        
        try:
            print(f"Trying FloWrestling API: {api_url}")
            response = self.session.get(api_url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Navigate the JSON structure
                if 'body' in data and 'data' in data['body']:
                    ranking_data = data['body']['data']
                    
                    # Look for rankings in the response
                    # The structure might have rankings per weight class
                    if 'rankings' in ranking_data:
                        for ranking in ranking_data['rankings']:
                            wrestlers.extend(self._parse_flowrestling_json(ranking))
                    
                    # Alternative: rankings might be in sub-rankings
                    if 'sub_rankings' in ranking_data:
                        for sub_ranking in ranking_data['sub_rankings']:
                            if 'rankings' in sub_ranking:
                                weight_class = sub_ranking.get('title', 'Unknown').split()[0]  # Extract weight from title like "125 lbs"
                                for athlete in sub_ranking['rankings']:
                                    wrestler_data = self._parse_flowrestling_athlete(athlete, weight_class)
                                    if wrestler_data:
                                        wrestlers.append(wrestler_data)
                
                if wrestlers:
                    print(f"✓ Found {len(wrestlers)} wrestlers from FloWrestling API")
                    return wrestlers
                else:
                    # Save response for debugging
                    with open('flow_api_response.json', 'w') as f:
                        json.dump(data, f, indent=2)
                    print("⚠️  API returned data but couldn't parse wrestlers. Saved to flow_api_response.json")
                    
        except requests.exceptions.RequestException as e:
            print(f"FloWrestling API request failed: {e}")
        except json.JSONDecodeError as e:
            print(f"FloWrestling API returned invalid JSON: {e}")
        except Exception as e:
            print(f"Unexpected error parsing FloWrestling API: {e}")
        
        return wrestlers
    
    def _parse_flowrestling_athlete(self, athlete, weight_class):
        """Parse individual athlete data from FloWrestling API"""
        try:
            return {
                "rank": athlete.get('rank', athlete.get('position', 0)),
                "name": athlete.get('name', athlete.get('athlete_name', athlete.get('first_name', '') + ' ' + athlete.get('last_name', ''))).strip(),
                "school": athlete.get('school', athlete.get('team', athlete.get('school_name', 'Unknown'))),
                "weight_class": str(weight_class),
                "source": "FloWrestling"
            }
        except Exception as e:
            return None
    
    def _fetch_ncaa_rankings(self):
        """Attempt to fetch from NCAA.com"""
        url = "https://www.ncaa.com/rankings/wrestling/d1"
        response = self.session.get(url, timeout=10)
        
        if response.status_code != 200:
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        wrestlers = []
        
        # Look for ranking tables
        tables = soup.find_all('table', class_=['rankings', 'table'])
        for table in tables:
            rows = table.find_all('tr')[1:]  # Skip header
            for row in rows:
                cols = row.find_all(['td', 'th'])
                if len(cols) >= 3:
                    try:
                        rank = int(cols[0].get_text(strip=True))
                        name = cols[1].get_text(strip=True)
                        school = cols[2].get_text(strip=True) if len(cols) > 2 else "Unknown"
                        weight = cols[3].get_text(strip=True) if len(cols) > 3 else "Unknown"
                        
                        wrestlers.append({
                            "rank": rank,
                            "name": name,
                            "school": school,
                            "weight_class": weight,
                            "source": "NCAA.com"
                        })
                    except (ValueError, IndexError):
                        continue
        
        return wrestlers
    
    def fetch_rankings_by_weight(self, weight_class):
        """
        Fetch rankings for a specific weight class.
        """
        all_rankings = self.fetch_rankings()
        return [w for w in all_rankings if w.get('weight_class') == str(weight_class)]


class PlaywrightScraper:
    """
    Alternative scraper using Playwright for JavaScript-rendered pages.
    Requires: pip install playwright && playwright install chromium
    """
    
    WEIGHT_CLASSES = ["125", "133", "141", "149", "157", "165", "174", "184", "197", "285"]
    
    def __init__(self):
        try:
            from playwright.sync_api import sync_playwright
            self.playwright = sync_playwright
        except ImportError:
            raise ImportError(
                "Playwright not installed. Install with: "
                "pip install playwright && playwright install chromium"
            )
    
    def fetch_rankings(self):
        """
        Fetch rankings using Playwright to render JavaScript.
        """
        wrestlers = []
        
        with self.playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            try:
                # Current FloWrestling NCAA DI Rankings URL (2025-26 season)
                url = "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings"
                print(f"Loading {url}...")
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                
                # Wait for content to load (give it extra time for JS)
                import time
                time.sleep(3)
                
                # Get the HTML after JS has rendered
                content = page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                # Parse the rankings
                wrestlers = self._parse_flowrestling(soup)
                
                if not wrestlers:
                    print("⚠️  Could not parse rankings from the page")
                    # Save HTML for debugging
                    with open('flow_debug.html', 'w', encoding='utf-8') as f:
                        f.write(content)
                    print("Saved page HTML to flow_debug.html for inspection")
                
            except Exception as e:
                print(f"Playwright scraping error: {e}")
                import traceback
                traceback.print_exc()
            finally:
                browser.close()
        
        return wrestlers
    
    def _parse_flowrestling(self, soup):
        """Parse FloWrestling rankings from rendered HTML"""
        wrestlers = []
        
        # Look for ranking elements (adjust selectors based on actual site structure)
        ranking_items = soup.find_all(['div', 'tr'], class_=lambda x: x and ('rank' in str(x).lower() or 'athlete' in str(x).lower()))
        
        for item in ranking_items:
            try:
                text = item.get_text(strip=True)
                # Parse based on observed structure
                # This will need to be adjusted based on actual HTML structure
                if any(c.isdigit() for c in text[:5]):
                    wrestlers.append({
                        "rank": 1,  # Extract actual rank
                        "name": "Name",  # Extract actual name
                        "school": "School",  # Extract actual school
                        "weight_class": "125",  # Extract actual weight
                        "source": "FloWrestling"
                    })
            except Exception:
                continue
        
        return wrestlers
