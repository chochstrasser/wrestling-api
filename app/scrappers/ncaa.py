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
    
    # Weight classes for NCAA Division I wrestling with FloWrestling URLs
    WEIGHT_CLASS_URLS = {
        "125": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54619-125-vincent-robinson",
        "133": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54620-133-lucas-byrd", 
        "141": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54621-141-real-woods",
        "149": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54622-149-caleb-rathjen",
        "157": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54623-157-jacori-teemer", 
        "165": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54624-165-dean-hamiti",
        "174": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54625-174-carter-starocci",
        "184": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54626-184-aaron-brooks",
        "197": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54627-197-stephen-buchanan", 
        "285": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54628-285-wyatt-hendrickson"
    }
    
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
        
        # Try FloWrestling weight class pages
        try:
            flow_wrestlers = self._fetch_flowrestling_weight_classes()
            if flow_wrestlers:
                wrestlers.extend(flow_wrestlers)
                return wrestlers
        except Exception as e:
            print(f"FloWrestling weight class scraping failed: {e}")
        
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
        Fetch from FloWrestling weight class specific pages
        """
        wrestlers = []
        
        # FloWrestling NCAA DI Rankings URLs by weight class (2025-26 season)
        weight_class_urls = {
            "125": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54619-125-vincent-robinson",
            "133": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54620-133-lucas-byrd",
            "141": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54621-141-real-woods",
            "149": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54622-149-caleb-rathjen",
            "157": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54623-157-jacori-teemer",
            "165": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54624-165-keegan-o-toole",
            "174": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54625-174-mitchell-mesenbrink",
            "184": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54626-184-parker-keckeisen",
            "197": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54627-197-stephen-buchanan",
            "285": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54628-285-wyatt-hendrickson"
        }
        
        for weight_class, url in weight_class_urls.items():
            try:
                print(f"Scraping {weight_class}lbs from FloWrestling...")
                response = self.session.get(url, timeout=15)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    weight_wrestlers = self._parse_flowrestling_weight_page(soup, weight_class)
                    wrestlers.extend(weight_wrestlers)
                    print(f"✓ Found {len(weight_wrestlers)} wrestlers at {weight_class}lbs")
                else:
                    print(f"⚠️  Failed to fetch {weight_class}lbs (Status: {response.status_code})")
                    
            except Exception as e:
                print(f"❌ Error fetching {weight_class}lbs: {e}")
                continue
        
        return wrestlers
    
    def _parse_flowrestling_weight_page(self, soup, weight_class):
        """
        Parse FloWrestling weight class ranking page
        """
        wrestlers = []
        
        # Look for ranking data in various possible structures
        # FloWrestling often uses JSON-LD or embedded data
        
        # Try to find JSON-LD structured data
        json_scripts = soup.find_all('script', type='application/ld+json')
        for script in json_scripts:
            try:
                data = json.loads(script.string)
                if 'itemListElement' in data:
                    for item in data['itemListElement']:
                        if 'name' in item and 'position' in item:
                            wrestlers.append({
                                "rank": item['position'],
                                "name": item['name'],
                                "school": item.get('affiliation', 'Unknown'),
                                "weight_class": weight_class,
                                "source": "FloWrestling"
                            })
            except (json.JSONDecodeError, KeyError):
                continue
        
        if wrestlers:
            return wrestlers
        
        # Try to find embedded JSON data in script tags
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string and 'ranking' in script.string.lower() and 'athlete' in script.string.lower():
                try:
                    # Look for JSON data patterns
                    script_text = script.string
                    
                    # Find JSON objects that might contain athlete data
                    import re
                    json_matches = re.findall(r'\{[^{}]*"name"[^{}]*\}', script_text)
                    
                    for match in json_matches:
                        try:
                            athlete_data = json.loads(match)
                            if 'name' in athlete_data:
                                wrestlers.append({
                                    "rank": len(wrestlers) + 1,  # Approximate rank based on order
                                    "name": athlete_data.get('name', 'Unknown'),
                                    "school": athlete_data.get('school', athlete_data.get('team', 'Unknown')),
                                    "weight_class": weight_class,
                                    "source": "FloWrestling"
                                })
                        except json.JSONDecodeError:
                            continue
                            
                except Exception:
                    continue
        
        if wrestlers:
            return wrestlers
        
        # Fallback: Try to parse HTML structure
        # Look for common ranking table/list patterns
        ranking_elements = soup.find_all(['div', 'li', 'tr'], class_=lambda x: x and any(
            keyword in str(x).lower() for keyword in ['rank', 'athlete', 'wrestler', 'player']
        ))
        
        for i, element in enumerate(ranking_elements[:20]):  # Limit to top 20
            text = element.get_text(strip=True)
            
            # Try to extract name and school from text patterns
            # Common patterns: "Name (School)" or "Name - School" or "Rank. Name School"
            import re
            
            # Pattern: "Name (School)"
            match = re.search(r'([A-Za-z\s]+)\s*\(([^)]+)\)', text)
            if match:
                name, school = match.groups()
                wrestlers.append({
                    "rank": i + 1,
                    "name": name.strip(),
                    "school": school.strip(),
                    "weight_class": weight_class,
                    "source": "FloWrestling"
                })
                continue
            
            # Pattern: "Rank. Name School" 
            match = re.search(r'(\d+)\.\s*([A-Za-z\s]+?)\s+([A-Za-z\s]+)$', text)
            if match:
                rank, name, school = match.groups()
                wrestlers.append({
                    "rank": int(rank),
                    "name": name.strip(),
                    "school": school.strip(),
                    "weight_class": weight_class,
                    "source": "FloWrestling"
                })
        
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
    
    def _fetch_flowrestling_weight_classes(self):
        """
        Scrape FloWrestling individual weight class pages using requests + BeautifulSoup
        """
        wrestlers = []
        
        for weight_class, url in self.WEIGHT_CLASS_URLS.items():
            try:
                print(f"Scraping {weight_class}lbs from FloWrestling...")
                response = self.session.get(url, timeout=10)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Look for wrestler ranking elements
                    # Try multiple selectors that might contain ranking data
                    ranking_elements = (
                        soup.find_all('div', class_=lambda x: x and 'rank' in str(x).lower()) or
                        soup.find_all('tr') or  # Table rows
                        soup.find_all('div', class_=lambda x: x and 'athlete' in str(x).lower()) or
                        soup.find_all('a', href=lambda x: x and 'athlete' in str(x))
                    )
                    
                    rank = 1
                    for element in ranking_elements:
                        wrestler_data = self._parse_wrestler_element(element, weight_class, rank)
                        if wrestler_data:
                            wrestlers.append(wrestler_data)
                            rank += 1
                            if rank > 20:  # Limit to top 20 per weight
                                break
                
                # Small delay between requests
                import time
                time.sleep(0.5)
                
            except Exception as e:
                print(f"Error scraping {weight_class}lbs: {e}")
                continue
        
        return wrestlers
    
    def _parse_wrestler_element(self, element, weight_class, rank):
        """
        Parse individual wrestler data from HTML element
        """
        try:
            text = element.get_text(strip=True)
            
            # Skip empty or non-relevant elements
            if not text or len(text) < 5:
                return None
            
            # Look for patterns like "John Smith, Iowa" or "John Smith Iowa"
            # Try to extract name and school
            name = None
            school = None
            
            # Pattern 1: "Name, School"
            if ',' in text:
                parts = text.split(',')
                if len(parts) >= 2:
                    name = parts[0].strip()
                    school = parts[1].strip()
            
            # Pattern 2: Look for links or specific structure
            elif element.name == 'a':
                name = text
                # Try to find school in parent or sibling elements
                parent = element.parent
                if parent:
                    school_elem = parent.find(text=True, recursive=False)
                    if school_elem:
                        school = school_elem.strip()
            
            # Pattern 3: Multi-word text - assume first part is name, last is school
            elif len(text.split()) >= 3:
                words = text.split()
                # Common pattern: "First Last School" or "First Last Jr School"
                if len(words) == 3:
                    name = f"{words[0]} {words[1]}"
                    school = words[2]
                elif len(words) >= 4:
                    # Assume school is last word, name is everything else
                    name = ' '.join(words[:-1])
                    school = words[-1]
            
            # Only return if we found both name and school
            if name and school and len(name) > 1 and len(school) > 1:
                # Filter out common non-wrestler text
                skip_words = ['view', 'more', 'ranking', 'subscribe', 'login', 'menu', 'search']
                if any(word in name.lower() for word in skip_words):
                    return None
                    
                return {
                    "rank": rank,
                    "name": name.title(),  # Proper case
                    "school": school.title(),
                    "weight_class": weight_class,
                    "source": "FloWrestling"
                }
            
        except Exception as e:
            # Silently skip parsing errors for individual elements
            pass
        
        return None
    
    def fetch_rankings_by_weight(self, weight_class):
        """
        Fetch rankings for a specific weight class.
        """
        if str(weight_class) in self.WEIGHT_CLASS_URLS:
            # Try specific weight class scraping first
            try:
                url = self.WEIGHT_CLASS_URLS[str(weight_class)]
                response = self.session.get(url, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    wrestlers = []
                    ranking_elements = soup.find_all(['div', 'tr', 'a'])
                    
                    rank = 1
                    for element in ranking_elements:
                        wrestler_data = self._parse_wrestler_element(element, str(weight_class), rank)
                        if wrestler_data:
                            wrestlers.append(wrestler_data)
                            rank += 1
                            if rank > 20:
                                break
                    
                    if wrestlers:
                        return wrestlers
            except Exception as e:
                print(f"Error fetching {weight_class}lbs specifically: {e}")
        
        # Fallback to getting all rankings and filtering
        all_rankings = self.fetch_rankings()
        return [w for w in all_rankings if w.get('weight_class') == str(weight_class)]


class PlaywrightScraper:
    """
    Alternative scraper using Playwright for JavaScript-rendered pages.
    Requires: pip install playwright && playwright install chromium
    """
    
    # Use the same URLs as NCAAScraper
    WEIGHT_CLASS_URLS = {
        "125": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54619-125-vincent-robinson",
        "133": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54620-133-lucas-byrd", 
        "141": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54621-141-real-woods",
        "149": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54622-149-caleb-rathjen",
        "157": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54623-157-jacori-teemer", 
        "165": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54624-165-dean-hamiti",
        "174": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54625-174-carter-starocci",
        "184": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54626-184-aaron-brooks",
        "197": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54627-197-stephen-buchanan", 
        "285": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54628-285-wyatt-hendrickson"
    }
    
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
        
        # FloWrestling NCAA DI Rankings URLs by weight class (2025-26 season)
        weight_class_urls = {
            "125": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54619-125-vincent-robinson",
            "133": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54620-133-lucas-byrd",
            "141": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54621-141-real-woods",
            "149": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54622-149-caleb-rathjen",
            "157": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54623-157-jacori-teemer",
            "165": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54624-165-keegan-o-toole",
            "174": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54625-174-mitchell-mesenbrink",
            "184": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54626-184-parker-keckeisen",
            "197": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54627-197-stephen-buchanan",
            "285": "https://www.flowrestling.org/rankings/14300895-2025-26-ncaa-di-wrestling-rankings/54628-285-wyatt-hendrickson"
        }
        
        with self.playwright() as p:
            browser = p.chromium.launch(headless=True)
            
            for weight_class, url in self.WEIGHT_CLASS_URLS.items():
                try:
                    page = browser.new_page()
                    print(f"Loading {weight_class}lbs rankings with Playwright...")
                    
                    page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    
                    # Wait for content to load
                    import time
                    time.sleep(3)
                    
                    # Look for ranking elements to appear
                    try:
                        page.wait_for_selector('div[class*="rank"], li[class*="athlete"], tr[class*="wrestler"]', timeout=5000)
                    except:
                        print(f"⚠️  No ranking elements found for {weight_class}lbs")
                    
                    # Get the HTML after JS has rendered
                    content = page.content()
                    soup = BeautifulSoup(content, 'html.parser')
                    
                    # Parse the rankings for this weight class
                    weight_wrestlers = self._parse_flowrestling_playwright(soup, weight_class)
                    wrestlers.extend(weight_wrestlers)
                    
                    if weight_wrestlers:
                        print(f"✓ Found {len(weight_wrestlers)} wrestlers at {weight_class}lbs")
                    else:
                        print(f"⚠️  No wrestlers found at {weight_class}lbs")
                        # Save HTML for debugging
                        with open(f'flow_debug_{weight_class}.html', 'w', encoding='utf-8') as f:
                            f.write(content)
                    
                    page.close()
                    
                except Exception as e:
                    print(f"❌ Error scraping {weight_class}lbs: {e}")
                    continue
            
            browser.close()
        
        return wrestlers
    
    def _parse_flowrestling_playwright(self, soup, weight_class):
        """Parse FloWrestling rankings from Playwright-rendered HTML"""
        wrestlers = []

        # FloWrestling uses a simple HTML table structure with data-test="ranking-content"
        # Table columns: Rank, Grade, Name, School, Previous

        # Find the ranking content container
        ranking_container = soup.find('div', {'data-test': 'ranking-content'})

        if not ranking_container:
            print(f"  ⚠️  Could not find ranking-content container for {weight_class}lbs")
            return wrestlers

        # Find the table within the container
        table = ranking_container.find('table')

        if not table:
            print(f"  ⚠️  Could not find table in ranking-content for {weight_class}lbs")
            return wrestlers

        # Get all rows from tbody
        tbody = table.find('tbody')
        if not tbody:
            # If no tbody, get rows directly from table
            rows = table.find_all('tr')
        else:
            rows = tbody.find_all('tr')

        if not rows:
            print(f"  ⚠️  No table rows found for {weight_class}lbs")
            return wrestlers

        # Skip the header row (first row) and process data rows
        for row in rows[1:]:
            cells = row.find_all('td')

            # Table structure: Rank | Grade | Name | School | Previous
            if len(cells) >= 4:
                try:
                    rank_text = cells[0].get_text(strip=True)
                    grade = cells[1].get_text(strip=True)
                    name = cells[2].get_text(strip=True)
                    school = cells[3].get_text(strip=True)
                    previous = cells[4].get_text(strip=True) if len(cells) > 4 else 'N/A'

                    # Skip if this looks like a header row
                    if rank_text.lower() == 'rank' or name.lower() == 'name':
                        continue

                    # Try to parse rank as integer
                    try:
                        rank = int(rank_text)
                    except ValueError:
                        # If rank is not a number, skip this row
                        continue

                    wrestler = {
                        "rank": rank,
                        "name": name,
                        "school": school,
                        "weight_class": weight_class,
                        "source": "FloWrestling",
                        "grade": grade,
                        "previous_rank": previous
                    }

                    wrestlers.append(wrestler)

                except Exception as e:
                    # Skip rows that don't match expected format
                    continue

        return wrestlers
