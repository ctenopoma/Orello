import { useEffect, useState } from 'react';
import { createBoard, getBoards } from './api';
import Board from './components/Board';
import './index.css';

function App() {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const data = await getBoards();
      setBoards(data);
      if (data.length > 0 && !selectedBoard) {
        setSelectedBoard(data[0]);
      }
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (newBoardTitle.trim()) {
      const newBoard = await createBoard(newBoardTitle.trim());
      setBoards([...boards, newBoard]);
      setSelectedBoard(newBoard);
      setNewBoardTitle('');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!selectedBoard) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="bg-white rounded-lg p-8 shadow-xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Task Manager</h1>
          <p className="text-gray-600 mb-4">Create your first board to get started</p>
          <form onSubmit={handleCreateBoard}>
            <input
              type="text"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Board name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Board
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Board board={selectedBoard} onUpdate={loadBoards} />
    </div>
  );
}

export default App;
