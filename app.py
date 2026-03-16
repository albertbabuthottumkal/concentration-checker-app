import sqlite3
import os
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'default_dev_key_for_session')

# --- Database Setup ---
DB_FILE = 'scores.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Create users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    # Create scores table for all games
    c.execute('''
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            game TEXT NOT NULL,
            score INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    conn.commit()
    conn.close()

# Initialize the db on startup
init_db()

@app.route('/')
def index():
    return render_template('index.html')

# --- Auth Routes ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('SELECT id, password_hash FROM users WHERE username = ?', (username,))
        user = c.fetchone()
        conn.close()
        
        if user and check_password_hash(user[1], password):
            session['user_id'] = user[0]
            session['username'] = username
            return redirect(url_for('report'))
        else:
            return render_template('login.html', error='Invalid username or password')
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            return render_template('register.html', error='All fields are required')
            
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        c.execute('SELECT id FROM users WHERE username = ?', (username,))
        if c.fetchone():
            conn.close()
            return render_template('register.html', error='Username already exists')
            
        hashed_password = generate_password_hash(password)
        try:
            c.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', (username, hashed_password))
            conn.commit()
        except sqlite3.Error as e:
            conn.close()
            return render_template('register.html', error='Database error occurred')
            
        conn.close()
        return redirect(url_for('login'))
        
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    return redirect(url_for('index'))

@app.route('/report')
def report():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    username = session['username']
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Fetch user's scores grouped by game
    c.execute('''
        SELECT game, MAX(score), AVG(score), COUNT(*) 
        FROM scores 
        WHERE user_id = ? 
        GROUP BY game
    ''', (user_id,))
    
    stats_raw = c.fetchall()
    conn.close()
    
    # Process stats for template
    stats = []
    for row in stats_raw:
        stats.append({
            'game': row[0],
            'high_score': row[1],
            'average_score': round(row[2], 1),
            'games_played': row[3]
        })
        
    return render_template('report.html', username=username, stats=stats)


# --- Game Routes ---
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

# --- API Routes ---
@app.route('/submit-score', methods=['POST'])
def submit_score():
    data = request.get_json()
    if not data or 'score' not in data or 'game' not in data:
        return jsonify({'error': 'Invalid payload'}), 400
        
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
        
    score = int(data['score'])
    game = data['game']
    user_id = session['user_id']
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Insert new score
    c.execute('INSERT INTO scores (user_id, game, score) VALUES (?, ?, ?)', (user_id, game, score))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Score saved successfully'}), 200

if __name__ == '__main__':
    app.run(debug=True)
