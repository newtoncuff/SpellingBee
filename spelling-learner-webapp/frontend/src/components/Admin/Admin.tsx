import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Admin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Puzzle {
  combo_id: number;
  word_id: number;
  word: string;
  difficulty: string;
  image_id: number;
  image_name: string;
  image_description: string;
}

interface PuzzleFormData {
  word: string;
  difficulty: string;
  image_name: string;
  image_description: string;
}

const Admin: React.FC = () => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState<PuzzleFormData>({
    word: '',
    difficulty: 'easy',
    image_name: '',
    image_description: ''
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPuzzles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/admin/puzzles`);
      setPuzzles(response.data);
    } catch (error) {
      showMessage('error', 'Failed to fetch puzzles');
      console.error('Error fetching puzzles:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPuzzles();
  }, [fetchPuzzles]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setFormData(prev => ({ ...prev, image_name: file.name }));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post(`${API_URL}/admin/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data.filename;
  };

  const handleAutoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await axios.post(`${API_URL}/admin/upload-auto-puzzle`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        showMessage('success', response.data.message);
        fetchPuzzles(); // Refresh the puzzles list
      }
    } catch (error) {
      showMessage('error', 'Failed to upload and create puzzle');
      console.error('Error auto-uploading:', error);
    } finally {
      setIsUploading(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageName = formData.image_name;
      
      // Upload file if a new one was selected
      if (uploadedFile) {
        imageName = await uploadImage(uploadedFile);
      }
      
      const puzzleData = {
        ...formData,
        image_name: imageName
      };

      if (editingPuzzle) {
        // Update existing puzzle
        await axios.put(`${API_URL}/admin/puzzles/${editingPuzzle.combo_id}`, puzzleData);
        showMessage('success', 'Puzzle updated successfully');
      } else {
        // Add new puzzle
        await axios.post(`${API_URL}/admin/puzzles`, puzzleData);
        showMessage('success', 'Puzzle added successfully');
      }

      // Reset form and refresh puzzles
      resetForm();
      fetchPuzzles();
    } catch (error) {
      showMessage('error', 'Failed to save puzzle');
      console.error('Error saving puzzle:', error);
    }
  };

  const handleEdit = (puzzle: Puzzle) => {
    setEditingPuzzle(puzzle);
    setFormData({
      word: puzzle.word,
      difficulty: puzzle.difficulty,
      image_name: puzzle.image_name,
      image_description: puzzle.image_description
    });
    setIsAddingNew(true);
  };

  const handleDelete = async (combo_id: number) => {
    if (!window.confirm('Are you sure you want to delete this puzzle?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/admin/puzzles/${combo_id}`);
      showMessage('success', 'Puzzle deleted successfully');
      fetchPuzzles();
    } catch (error) {
      showMessage('error', 'Failed to delete puzzle');
      console.error('Error deleting puzzle:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      word: '',
      difficulty: 'easy',
      image_name: '',
      image_description: ''
    });
    setEditingPuzzle(null);
    setIsAddingNew(false);
    setUploadedFile(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  if (isLoading) {
    return <div className="admin-loading">Loading puzzles...</div>;
  }

  return (
    <div className="admin-container">
      <h1>Spelling Bee Admin</h1>
      
      {message && (
        <div className={`admin-message admin-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-actions">
        <div className="quick-upload-section">
          <label htmlFor="auto-upload-input" className="btn-quick-upload">
            {isUploading ? 'Uploading...' : '📸 Quick Upload (Auto-Create Puzzle)'}
          </label>
          <input
            id="auto-upload-input"
            type="file"
            accept="image/*"
            onChange={handleAutoUpload}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
          <p className="upload-hint">
            Upload an image and we'll automatically create a puzzle! 
            <br />
            <small>Filename becomes the word (e.g., "cat.jpg" → "cat" puzzle)</small>
          </p>
        </div>
        
        <button 
          className="btn-add-new"
          onClick={() => setIsAddingNew(true)}
          disabled={isAddingNew}
        >
          Add New Puzzle Manually
        </button>
      </div>

      {isAddingNew && (
        <div className="puzzle-form-container">
          <h2>{editingPuzzle ? 'Edit Puzzle' : 'Add New Puzzle'}</h2>
          <form onSubmit={handleSubmit} className="puzzle-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="word">Word:</label>
                <input
                  type="text"
                  id="word"
                  name="word"
                  value={formData.word}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="difficulty">Difficulty:</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  required
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="image_name">Image Name:</label>
                <input
                  type="text"
                  id="image_name"
                  name="image_name"
                  value={formData.image_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="image_file">Upload New Image:</label>
                <input
                  type="file"
                  id="image_file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="image_description">Image Description:</label>
              <input
                type="text"
                id="image_description"
                name="image_description"
                value={formData.image_description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save">
                {editingPuzzle ? 'Update Puzzle' : 'Add Puzzle'}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="puzzles-list">
        <h2>Existing Puzzles ({puzzles.length})</h2>
        <div className="puzzles-table">
          <div className="table-header">
            <div>Word</div>
            <div>Difficulty</div>
            <div>Image</div>
            <div>Description</div>
            <div>Actions</div>
          </div>
          
          {puzzles.map((puzzle) => (
            <div key={puzzle.combo_id} className="table-row">
              <div className="puzzle-word">{puzzle.word}</div>
              <div className="puzzle-difficulty">
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(puzzle.difficulty) }}
                >
                  {puzzle.difficulty}
                </span>
              </div>
              <div className="puzzle-image">
                <div className="image-info">
                  <img 
                    src={`${API_URL}/images/${puzzle.image_name}`}
                    alt={puzzle.image_description}
                    className="thumbnail"
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      const statusElement = target.parentElement?.querySelector('.image-status');
                      if (statusElement) {
                        statusElement.textContent = '✓ Image Available';
                        statusElement.className = 'image-status available';
                      }
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.image-placeholder')) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'image-placeholder';
                        placeholder.textContent = 'No Image';
                        parent.insertBefore(placeholder, parent.firstChild);
                      }
                      const statusElement = parent?.querySelector('.image-status');
                      if (statusElement) {
                        statusElement.textContent = '⚠ Image Missing';
                        statusElement.className = 'image-status missing';
                      }
                    }}
                  />
                  <div className="image-details">
                    <div className="image-filename">{puzzle.image_name}</div>
                    <div className="image-status checking">Checking...</div>
                  </div>
                </div>
              </div>
              <div className="puzzle-description">{puzzle.image_description}</div>
              <div className="puzzle-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleEdit(puzzle)}
                >
                  Edit
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(puzzle.combo_id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;