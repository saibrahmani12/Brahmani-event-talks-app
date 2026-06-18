import re
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
        # Using a timeout to prevent hanging requests
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        
        # The XML feed contains namespace: http://www.w3.org/2005/Atom
        root = ET.fromstring(response.content)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries_data = []
        for entry in root.findall('atom:entry', ns):
            title_el = entry.find('atom:title', ns)
            date_str = title_el.text if title_el is not None else ""
            
            updated_el = entry.find('atom:updated', ns)
            updated_str = updated_el.text if updated_el is not None else ""
            
            link_el = entry.find('atom:link[@rel="alternate"]', ns)
            if link_el is None:
                link_el = entry.find('atom:link', ns)
            link_url = link_el.attrib.get('href', '') if link_el is not None else ""
            
            content_el = entry.find('atom:content', ns)
            content_html = content_el.text if content_el is not None else ""
            
            # Parse individual updates within this entry
            # Since Google release notes group updates by day, one entry contains multiple <h3> headings.
            # A regex to find <h3>...</h3> and grab everything up to the next <h3> or end.
            updates = []
            pattern = r'<h3>(.*?)</h3>(.*?(?=(?:<h3>|$)))'
            matches = re.findall(pattern, content_html, re.DOTALL | re.IGNORECASE)
            
            if matches:
                for idx, (type_text, body_html) in enumerate(matches):
                    type_text = type_text.strip()
                    body_html = body_html.strip()
                    update_id = f"{date_str.replace(' ', '_').replace(',', '')}_{idx}"
                    
                    # Strip HTML tags for clean plain text (useful for Tweet preview)
                    text_content = re.sub('<[^<]+?>', '', body_html)
                    # Normalize whitespace
                    text_content = ' '.join(text_content.split())
                    
                    updates.append({
                        'id': update_id,
                        'date': date_str,
                        'type': type_text,
                        'content_html': f"<h3>{type_text}</h3>{body_html}",
                        'plain_text': text_content,
                        'link': link_url
                    })
            else:
                # If no <h3> was found, treat the whole content as one update
                text_content = re.sub('<[^<]+?>', '', content_html)
                text_content = ' '.join(text_content.split())
                updates.append({
                    'id': f"{date_str.replace(' ', '_').replace(',', '')}_0",
                    'date': date_str,
                    'type': 'Update',
                    'content_html': content_html,
                    'plain_text': text_content,
                    'link': link_url
                })
            
            entries_data.append({
                'date': date_str,
                'updated': updated_str,
                'link': link_url,
                'updates': updates
            })
            
        return jsonify({
            'status': 'success',
            'data': entries_data
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
