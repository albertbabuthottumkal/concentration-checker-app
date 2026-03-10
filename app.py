import sqlite3
import os
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# --- Database Setup ---
DB_FILE = 'scores.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS neural_breach_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            score INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize the db on startup
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game():
    return render_template('game.html')

@app.route('/constellation')
def constellation():
    return render_template('constellation.html')

@app.route('/oddone')
def oddone():
    return render_template('oddone.html')

@app.route('/reflex')
def reflex():
    return render_template('reflex.html')

@app.route('/stroop')
def stroop():
    return render_template('stroop.html')

@app.route('/neural_breach')
def neural_breach():
    return render_template('neural_breach.html')

@app.route('/submit-score', methods=['POST'])
def submit_score():
    data = request.get_json()
    if not data or 'score' not in data:
        return jsonify({'error': 'Invalid payload'}), 400
        
    score = int(data['score'])
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Insert new score
    c.execute('INSERT INTO neural_breach_scores (score) VALUES (?)', (score,))
    conn.commit()
    
    # Calculate percentile against the top 10 scores
    c.execute('''
        SELECT score FROM neural_breach_scores 
        ORDER BY score DESC LIMIT 10
    ''')
    top_scores = [row[0] for row in c.fetchall()]
    conn.close()
    
    if not top_scores:
        percentile = 100
    else:
        # Count how many scores in the top 10 are strictly less than the user's score
        worse_scores_count = sum(1 for s in top_scores if score > s)
        percentile = int((worse_scores_count / len(top_scores)) * 100)
    
    return jsonify({
        'message': 'Score saved',
        'top_scores': top_scores,
        'percentile': percentile
    }), 200

if __name__ == '__main__':
    app.run(debug=True)
