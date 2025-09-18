import sqlite3
import os
from datetime import datetime

class SpellingBeeDatabase:
    def __init__(self, db_path=None):
        if db_path is None:
            # Default path: data/database/spelling_bee.db
            self.db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spelling_bee.db')
        else:
            self.db_path = db_path
        
        # Ensure the database directory exists
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        # Initialize the database
        self.init_db()
    
    def get_connection(self):
        """Get a database connection with row factory"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_db(self):
        """Initialize database tables and sample data"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Create tables if they don't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                difficulty TEXT NOT NULL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_path TEXT NOT NULL,
                description TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS combos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word_id INTEGER NOT NULL,
                image_id INTEGER NOT NULL,
                FOREIGN KEY (word_id) REFERENCES words (id),
                FOREIGN KEY (image_id) REFERENCES images (id),
                UNIQUE(word_id, image_id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                combo_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT 0,
                correct BOOLEAN NOT NULL DEFAULT 0,
                FOREIGN KEY (combo_id) REFERENCES combos (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                consecutive_correct INTEGER DEFAULT 0
            )
        ''')
        
        # Add column if it doesn't exist (for existing databases)
        try:
            cursor.execute('ALTER TABLE users ADD COLUMN consecutive_correct INTEGER DEFAULT 0')
        except sqlite3.OperationalError:
            # Column already exists
            pass
        
        # Add sample data if tables are empty
        cursor.execute('SELECT COUNT(*) FROM words')
        if cursor.fetchone()[0] == 0:
            self._populate_from_images(cursor)
        
        conn.commit()
        conn.close()
    
    def _get_available_images(self):
        """Get list of available image files from the backend API"""
        try:
            # Try to get list of images from the images directory
            # Since we're running in the same container environment, 
            # we can directly access the images folder
            images_folder = '/app/data/images'
            if os.path.exists(images_folder):
                image_files = []
                for filename in os.listdir(images_folder):
                    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')) and filename != '.gitkeep':
                        image_files.append(filename)
                return image_files
            else:
                return []
        except Exception as e:
            print(f"Error getting images: {e}")
            return []
    
    def _populate_from_images(self, cursor):
        """Populate database with puzzles from available images"""
        # Add a default user
        cursor.execute('INSERT INTO users (name) VALUES (?)', ('default_user',))
        
        # Get available images
        image_files = self._get_available_images()
        
        if not image_files:
            print("No image files found, falling back to sample data")
            self._populate_sample_data(cursor)
            return
        
        print(f"Found {len(image_files)} images, creating puzzles...")
        
        # Create puzzles for each image (excluding star images)
        for image_filename in image_files:
            # Skip star progress images
            if image_filename in ['star.jpg', 'nostar.jpg']:
                continue
                
            # Extract word from filename (remove extension)
            word = os.path.splitext(image_filename)[0].upper()
            
            # Determine difficulty based on word length
            difficulty = self._determine_difficulty_by_length(word)
            
            # Insert word
            cursor.execute('INSERT INTO words (text, difficulty) VALUES (?, ?)', (word, difficulty))
            word_id = cursor.lastrowid
            
            # Insert image
            cursor.execute('INSERT INTO images (file_path, description) VALUES (?, ?)', (image_filename, word.lower()))
            image_id = cursor.lastrowid
            
            # Create combo
            cursor.execute('INSERT INTO combos (word_id, image_id) VALUES (?, ?)', (word_id, image_id))
            
            print(f"Created puzzle: {word} ({difficulty}) -> {image_filename}")
    
    def _populate_sample_data(self, cursor):
        """Populate database with sample data (fallback)"""
        # Sample words with different difficulty levels
        words = [
            ('CAT', 'easy'),
            ('DOG', 'easy'),
            ('APPLE', 'easy'),
            ('TABLE', 'easy'),
            ('ORANGE', 'medium'),
            ('ELEPHANT', 'hard'),
            ('COMPUTER', 'medium'),
        ]
        cursor.executemany('INSERT INTO words (text, difficulty) VALUES (?, ?)', words)
        
        # Add sample images
        images = [
            ('cat.jpg', 'cat'),
            ('dog.jpg', 'dog'),
            ('apple.jpg', 'apple'),
            ('table.jpg', 'table'),
            ('orange.jpg', 'orange'),
            ('elephant.jpg', 'elephant'),
            ('computer.jpg', 'computer')
        ]
        cursor.executemany('INSERT INTO images (file_path, description) VALUES (?, ?)', images)
        
        # Create word-image combos
        for i in range(1, len(words) + 1):
            cursor.execute('INSERT INTO combos (word_id, image_id) VALUES (?, ?)', (i, i))
    
    def _determine_difficulty_by_length(self, word):
        """Determine difficulty based on word length"""
        length = len(word)
        if length <= 4:
            return 'easy'
        elif length <= 7:
            return 'medium'
        else:
            return 'hard'
    
    def get_recent_combos(self, user_id, limit=10):
        """Get recently used combos for a user"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT combo_id FROM tasks 
            WHERE user_id = ? 
            ORDER BY date DESC 
            LIMIT ?
        ''', (user_id, limit))
        
        recent_combos = [row['combo_id'] for row in cursor.fetchall()]
        conn.close()
        return recent_combos
    
    def get_puzzle_combo(self, difficulty, recent_combos=None):
        """Get a word/image combo for the specified difficulty"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if recent_combos:
            cursor.execute('''
                SELECT c.id, w.text, w.difficulty, i.file_path, i.description 
                FROM combos c
                JOIN words w ON c.word_id = w.id
                JOIN images i ON c.image_id = i.id
                WHERE c.id NOT IN ({})
                ORDER BY RANDOM()
                LIMIT 1
            '''.format(','.join(['?'] * len(recent_combos))), 
            recent_combos)
        else:
            cursor.execute('''
                SELECT c.id, w.text, w.difficulty, i.file_path, i.description 
                FROM combos c
                JOIN words w ON c.word_id = w.id
                JOIN images i ON c.image_id = i.id
                ORDER BY RANDOM()
                LIMIT 1
            ''')
        
        result = cursor.fetchone()
        
        if not result:
            # If no unused combos are found, just get any combo of the right difficulty
            cursor.execute('''
                SELECT c.id, w.text, w.difficulty, i.file_path, i.description 
                FROM combos c
                JOIN words w ON c.word_id = w.id
                JOIN images i ON c.image_id = i.id
                ORDER BY RANDOM()
                LIMIT 1
            ''')
            result = cursor.fetchone()
        
        conn.close()
        return dict(result) if result else None
    
    def create_task(self, user_id, combo_id):
        """Create a new task in the database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO tasks (user_id, combo_id, date, completed, correct)
            VALUES (?, ?, ?, 0, 0)
        ''', (user_id, combo_id, now))
        
        task_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return task_id
    
    def update_task_result(self, task_id, is_correct):
        """Update task with completion result"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE tasks
            SET completed = 1, correct = ?
            WHERE id = ?
        ''', (1 if is_correct else 0, task_id))
        
        conn.commit()
        conn.close()
    
    def update_user_progress(self, user_id, is_correct):
        """Update user's consecutive correct answers progress"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if is_correct:
            # Increment consecutive correct
            cursor.execute('''
                UPDATE users 
                SET consecutive_correct = consecutive_correct + 1
                WHERE id = ?
            ''', (user_id,))
        else:
            # Reset consecutive correct to 0
            cursor.execute('''
                UPDATE users 
                SET consecutive_correct = 0
                WHERE id = ?
            ''', (user_id,))
        
        conn.commit()
        conn.close()
    
    def get_user_progress(self, user_id):
        """Get user's current consecutive correct count"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT consecutive_correct FROM users WHERE id = ?', (user_id,))
        result = cursor.fetchone()
        
        conn.close()
        return result['consecutive_correct'] if result else 0
    
    def reset_user_progress(self, user_id):
        """Reset user's consecutive correct count to 0"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users 
            SET consecutive_correct = 0
            WHERE id = ?
        ''', (user_id,))
        
        conn.commit()
        conn.close()
    
    def get_user_stats(self, user_id):
        """Get statistics for a user"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get overall stats
        cursor.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(completed) as completed,
                SUM(correct) as correct
            FROM tasks
            WHERE user_id = ?
        ''', (user_id,))
        overall_stats = dict(cursor.fetchone())
        
        # Get stats by difficulty
        cursor.execute('''
            SELECT 
                w.difficulty,
                COUNT(*) as total,
                SUM(t.completed) as completed,
                SUM(t.correct) as correct
            FROM tasks t
            JOIN combos c ON t.combo_id = c.id
            JOIN words w ON c.word_id = w.id
            WHERE t.user_id = ?
            GROUP BY w.difficulty
        ''', (user_id,))
        difficulty_stats = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return {
            'overall': overall_stats,
            'by_difficulty': difficulty_stats
        }
    
    def get_all_puzzles(self):
        """Get all puzzles with word, image, and combo information"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                c.id as combo_id,
                w.id as word_id,
                w.text as word,
                w.difficulty,
                i.id as image_id,
                i.file_path as image_name,
                i.description as image_description
            FROM combos c
            JOIN words w ON c.word_id = w.id
            JOIN images i ON c.image_id = i.id
            ORDER BY w.difficulty, w.text
        ''')
        
        puzzles = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return puzzles
    
    def add_puzzle_from_image(self, image_filename):
        """Add a puzzle automatically based on image filename"""
        # Extract word from filename (remove extension)
        word = os.path.splitext(image_filename)[0].lower()
        
        # Determine difficulty based on word length
        difficulty = self._determine_difficulty_by_length(word)
        
        # Use word as description
        image_description = word
        
        # Add the puzzle
        return self.add_puzzle(word, difficulty, image_filename, image_description)
    
    def add_puzzle(self, word, difficulty, image_name, image_description):
        """Add a new puzzle (word + image + combo)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Insert word
            cursor.execute('INSERT INTO words (text, difficulty) VALUES (?, ?)', (word, difficulty))
            word_id = cursor.lastrowid
            
            # Insert image
            cursor.execute('INSERT INTO images (file_path, description) VALUES (?, ?)', (image_name, image_description))
            image_id = cursor.lastrowid
            
            # Create combo
            cursor.execute('INSERT INTO combos (word_id, image_id) VALUES (?, ?)', (word_id, image_id))
            combo_id = cursor.lastrowid
            
            conn.commit()
            return combo_id
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def update_puzzle(self, combo_id, word, difficulty, image_name, image_description):
        """Update an existing puzzle"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Get word_id and image_id from combo
            cursor.execute('SELECT word_id, image_id FROM combos WHERE id = ?', (combo_id,))
            result = cursor.fetchone()
            if not result:
                raise ValueError(f"Combo with id {combo_id} not found")
            
            word_id, image_id = result
            
            # Update word
            cursor.execute('UPDATE words SET text = ?, difficulty = ? WHERE id = ?', (word, difficulty, word_id))
            
            # Update image
            cursor.execute('UPDATE images SET file_path = ?, description = ? WHERE id = ?', (image_name, image_description, image_id))
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def delete_puzzle(self, combo_id):
        """Delete a puzzle (combo, word, and image)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Get word_id and image_id from combo
            cursor.execute('SELECT word_id, image_id FROM combos WHERE id = ?', (combo_id,))
            result = cursor.fetchone()
            if not result:
                raise ValueError(f"Combo with id {combo_id} not found")
            
            word_id, image_id = result
            
            # Delete combo first (due to foreign key constraints)
            cursor.execute('DELETE FROM combos WHERE id = ?', (combo_id,))
            
            # Delete word and image
            cursor.execute('DELETE FROM words WHERE id = ?', (word_id,))
            cursor.execute('DELETE FROM images WHERE id = ?', (image_id,))
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()