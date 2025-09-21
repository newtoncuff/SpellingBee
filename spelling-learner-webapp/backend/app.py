from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import random
import sys

# Add the data directory to Python path for database module import
# In Docker container, data is mounted at /app/data
data_path = '/app/data'
sys.path.insert(0, data_path)

# Import the database module
from database import SpellingBeeDatabase

app = Flask(__name__)
CORS(app, origins=["http://192.168.1.99:3000", "http://localhost:3000"])

# Setup paths
IMAGES_FOLDER = '/app/data/images'  # Direct path to mounted volume
DB_PATH = '/app/data/database/spelling_bee.db'  # Direct path to mounted volume

# Add this function
def get_base_url():
    return os.getenv('BASE_URL', 'http://192.168.1.99:5000')

# Debug paths
print(f"DEBUG: IMAGES_FOLDER = {IMAGES_FOLDER}", flush=True)
print(f"DEBUG: IMAGES_FOLDER exists = {os.path.exists(IMAGES_FOLDER)}", flush=True)
if os.path.exists(IMAGES_FOLDER):
    print(f"DEBUG: Files in IMAGES_FOLDER = {os.listdir(IMAGES_FOLDER)}", flush=True)

# Ensure directories exist
os.makedirs(IMAGES_FOLDER, exist_ok=True)

# Initialize database
db = SpellingBeeDatabase(DB_PATH)

# Routes
@app.route('/api/difficulty', methods=['GET'])
def get_difficulty_levels():
    return jsonify({
        'levels': [
            {'id': 'easy', 'name': 'Easy (3-5 letters)'},
            {'id': 'medium', 'name': 'Medium (5-7 letters)'},
            {'id': 'hard', 'name': 'Hard (7-10 letters)'}
        ]
    })

@app.route('/api/puzzle', methods=['GET'])
def get_puzzle():
    difficulty = request.args.get('difficulty', 'easy')
    user_id = request.args.get('user_id', 1)
    
    # Get recent combos to avoid repetition
    recent_combos = db.get_recent_combos(user_id)
    
    # Get a word/image combo of the selected difficulty
    combo = db.get_puzzle_combo(difficulty, recent_combos)
    
    if not combo:
        return jsonify({'error': 'No puzzles found for this difficulty level'}), 404
    
    combo_id = combo['id']
    word = combo['text']
    image_path = combo['file_path']
    image_desc = combo['description']
    
    # Randomly select positions to blank out
    word_length = len(word)
    blanks_count = min(word_length - 1, max(1, word_length // 2))  # At least 1 blank, at most half the letters
    blank_positions = sorted(random.sample(range(word_length), blanks_count))  # Sort the positions
    print(f"DEBUG: Generated blank_positions for '{word}': {blank_positions}", flush=True)
    
    # Create puzzle representation
    puzzle = []
    for i, char in enumerate(word):
        if i in blank_positions:
            puzzle.append(None)  # Blank position
        else:
            puzzle.append(char)  # Visible letter
    
    # Record the task in the database
    task_id = db.create_task(user_id, combo_id)
    
    return jsonify({
        'task_id': task_id,
        'puzzle': puzzle,
        'original_word': word,  # For verification on frontend
        'image_url': f'{get_base_url()}/api/images/{image_path}',  # Full URL
        'image_alt': image_desc,
        'blank_positions': blank_positions
    })

@app.route('/api/submit', methods=['POST'])
def submit_answer():
    print("DEBUG: /api/submit endpoint called!", flush=True)
    data = request.json
    print(f"DEBUG: Received data: {data}", flush=True)
    
    # Debug the full request data
    print(f"DEBUG: Full request data keys: {list(data.keys()) if data else 'None'}", flush=True)
    
    task_id = data.get('task_id')
    user_answer = data.get('answer')
    original_word = data.get('original_word')
    user_id = data.get('user_id', 1)  # Default to user 1
    print(f"DEBUG: task_id='{task_id}', user_answer='{user_answer}', original_word='{original_word}'", flush=True)
    
    if not all([task_id, user_answer, original_word]):
        return jsonify({'error': 'Missing required data'}), 400
    
    print(f"User answer: {user_answer.lower()}", flush=True)
    print(f"Original word: {original_word.lower()}", flush=True)

    is_correct = user_answer.lower() == original_word.lower()
    
    # Update task result in database
    db.update_task_result(task_id, is_correct)
    
    # Update user progress
    db.update_user_progress(user_id, is_correct)
    
    # Get current progress for response
    consecutive_correct = db.get_user_progress(user_id)
    
    # Check if user reached 10 correct answers
    celebration = False
    if consecutive_correct >= 10:
        celebration = True
        # Reset progress after celebration
        db.reset_user_progress(user_id)
        consecutive_correct = 0
    
    return jsonify({
        'correct': is_correct,
        'message': 'Correct! Great job!' if is_correct else f'Not quite! The word was "{original_word}".',
        'consecutive_correct': consecutive_correct,
        'celebration': celebration
    })

@app.route('/api/progress', methods=['GET'])
def get_progress():
    user_id = request.args.get('user_id', 1)
    consecutive_correct = db.get_user_progress(user_id)
    return jsonify({'consecutive_correct': consecutive_correct})

@app.route('/api/images/<path:filename>')
def get_image(filename):
    print(f"DEBUG: Requested image: {filename}", flush=True)
    print(f"DEBUG: Looking in folder: {IMAGES_FOLDER}", flush=True)
    full_path = os.path.join(IMAGES_FOLDER, filename)
    print(f"DEBUG: Full path: {full_path}", flush=True)
    print(f"DEBUG: File exists: {os.path.exists(full_path)}", flush=True)
    
    if not os.path.exists(full_path):
        print(f"DEBUG: File not found, available files: {os.listdir(IMAGES_FOLDER) if os.path.exists(IMAGES_FOLDER) else 'Directory not found'}", flush=True)
        return "File not found", 404
    
    return send_from_directory(IMAGES_FOLDER, filename)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    user_id = request.args.get('user_id', 1)
    
    # Get user statistics from database
    stats = db.get_user_stats(user_id)
    
    return jsonify(stats)

# Admin endpoints for puzzle management
@app.route('/api/admin/puzzles', methods=['GET'])
def get_all_puzzles():
    """Get all puzzles for admin management"""
    try:
        puzzles = db.get_all_puzzles()
        return jsonify(puzzles)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/puzzles', methods=['POST'])
def add_puzzle():
    """Add a new puzzle"""
    try:
        data = request.json
        word = data.get('word')
        difficulty = data.get('difficulty')
        image_name = data.get('image_name')
        image_description = data.get('image_description')
        
        if not all([word, difficulty, image_name, image_description]):
            return jsonify({'error': 'All fields are required'}), 400
        
        combo_id = db.add_puzzle(word, difficulty, image_name, image_description)
        return jsonify({'success': True, 'combo_id': combo_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/puzzles/<int:combo_id>', methods=['PUT'])
def update_puzzle(combo_id):
    """Update an existing puzzle"""
    try:
        data = request.json
        word = data.get('word')
        difficulty = data.get('difficulty')
        image_name = data.get('image_name')
        image_description = data.get('image_description')
        
        if not all([word, difficulty, image_name, image_description]):
            return jsonify({'error': 'All fields are required'}), 400
        
        db.update_puzzle(combo_id, word, difficulty, image_name, image_description)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/puzzles/<int:combo_id>', methods=['DELETE'])
def delete_puzzle(combo_id):
    """Delete a puzzle"""
    try:
        db.delete_puzzle(combo_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/upload', methods=['POST'])
def upload_image():
    """Upload a new image file"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save the file to the images directory
        filename = file.filename
        file_path = os.path.join(IMAGES_FOLDER, filename)
        file.save(file_path)
        
        return jsonify({'success': True, 'filename': filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/upload-auto-puzzle', methods=['POST'])
def upload_auto_puzzle():
    """Upload an image and automatically create a puzzle based on the filename"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save the file to the images directory
        filename = file.filename
        file_path = os.path.join(IMAGES_FOLDER, filename)
        file.save(file_path)
        
        # Create puzzle automatically based on filename
        combo_id = db.add_puzzle_from_image(filename)
        
        # Extract word and difficulty for response
        word = os.path.splitext(filename)[0].lower()
        difficulty = db._determine_difficulty_by_length(word)
        
        return jsonify({
            'success': True, 
            'filename': filename,
            'combo_id': combo_id,
            'word': word,
            'difficulty': difficulty,
            'message': f'Puzzle created: "{word}" ({difficulty} difficulty)'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("="*50)
    print("DEBUG: Flask app starting up!")
    print("="*50)
    app.run(debug=True, host='0.0.0.0', port=5000)