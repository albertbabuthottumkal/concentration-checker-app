import os
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
from supabase import create_client, Client

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'default_dev_key_for_session')

# --- Supabase Database Setup ---
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://dlpcqrurcqhojylfouyy.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscGNxcnVyY3Fob2p5bGZvdXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTU0MDAsImV4cCI6MjA4OTIzMTQwMH0.85wCbdghSKa2HvcGxS8Twlwanhn6yuUj0qajABs-q5s')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/')
def index():
    return render_template('index.html')

# --- Auth Routes ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        response = supabase.table('users').select('id, password_hash').eq('username', username).execute()
        
        if response.data:
            user = response.data[0]
            if check_password_hash(user['password_hash'], password):
                session['user_id'] = user['id']
                session['username'] = username
                return redirect(url_for('report'))
            
        return render_template('login.html', error='Invalid username or password')
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            return render_template('register.html', error='All fields are required')
            
        response = supabase.table('users').select('id').eq('username', username).execute()
        if response.data:
            return render_template('register.html', error='Username already exists')
            
        hashed_password = generate_password_hash(password)
        try:
            supabase.table('users').insert({'username': username, 'password_hash': hashed_password}).execute()
        except Exception as e:
            return render_template('register.html', error='Database error occurred')
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
    
    response = supabase.table('scores').select('game, score').eq('user_id', user_id).execute()
    
    # Process stats for template
    game_stats = {}
    for row in response.data:
        g = row['game']
        s = row['score']
        if g not in game_stats:
            game_stats[g] = {'high_score': s, 'total': s, 'count': 1}
        else:
            game_stats[g]['high_score'] = max(game_stats[g]['high_score'], s)
            game_stats[g]['total'] += s
            game_stats[g]['count'] += 1
            
    stats = []
    for g, data in game_stats.items():
        stats.append({
            'game': g,
            'high_score': data['high_score'],
            'average_score': round(data['total'] / data['count'], 1),
            'games_played': data['count']
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
    
    try:
        supabase.table('scores').insert({
            'user_id': user_id, 
            'game': game, 
            'score': score
        }).execute()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    return jsonify({'message': 'Score saved successfully'}), 200

if __name__ == '__main__':
    app.run(debug=True)
