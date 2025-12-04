import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useEffect, useState } from 'react';
import { createList, moveCard, updateBoard } from '../api';
import Card from './Card';
import List from './List';

const THEMES = {
    light: {
        name: 'Light',
        bg: 'bg-gray-50',
        header: 'bg-white border-b border-gray-200',
        headerText: 'text-gray-900',
        accentBg: 'bg-blue-500',
        accentText: 'text-blue-600',
        card: 'bg-white border-l-4 border-blue-500 shadow-sm hover:shadow-md',
        list: 'bg-gray-100',
        listTitle: 'text-gray-700 font-semibold',
        button: 'bg-blue-500 hover:bg-blue-600 text-white',
        buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
        inputBg: 'bg-white',
        inputText: 'text-gray-900',
        inputBorder: 'border-gray-300',
        inputPlaceholder: 'placeholder-gray-400',
    },
    dark: {
        name: 'Dark',
        bg: 'bg-gray-900',
        header: 'bg-gray-950 border-b border-gray-700',
        headerText: 'text-gray-50',
        accentBg: 'bg-blue-500',
        accentText: 'text-blue-400',
        card: 'bg-gray-800 border-l-4 border-blue-500 shadow-lg hover:shadow-xl hover:bg-gray-750',
        list: 'bg-gray-850',
        listTitle: 'text-gray-100 font-semibold',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-gray-100',
        inputBg: 'bg-gray-700',
        inputText: 'text-gray-100',
        inputBorder: 'border-gray-600',
        inputPlaceholder: 'placeholder-gray-400',
    },
    ocean: {
        name: 'Ocean',
        bg: 'bg-gradient-to-br from-slate-900 to-slate-800',
        header: 'bg-slate-950/80 backdrop-blur-sm border-b border-slate-700',
        headerText: 'text-cyan-50',
        accentBg: 'bg-cyan-500',
        accentText: 'text-cyan-400',
        card: 'bg-slate-800 border-l-4 border-cyan-500 shadow-lg hover:shadow-cyan-500/20',
        list: 'bg-slate-800/50',
        listTitle: 'text-cyan-300 font-semibold',
        button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
        buttonSecondary: 'bg-slate-700 hover:bg-slate-600 text-cyan-100',
        inputBg: 'bg-slate-700',
        inputText: 'text-cyan-50',
        inputBorder: 'border-slate-600',
        inputPlaceholder: 'placeholder-cyan-400/50',
    },
    forest: {
        name: 'Forest',
        bg: 'bg-gradient-to-br from-emerald-900 to-teal-900',
        header: 'bg-emerald-950/80 backdrop-blur-sm border-b border-emerald-700',
        headerText: 'text-emerald-50',
        accentBg: 'bg-emerald-500',
        accentText: 'text-emerald-400',
        card: 'bg-emerald-800 border-l-4 border-emerald-500 shadow-lg hover:shadow-emerald-500/20',
        list: 'bg-emerald-800/50',
        listTitle: 'text-emerald-300 font-semibold',
        button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        buttonSecondary: 'bg-emerald-700 hover:bg-emerald-600 text-emerald-100',
        inputBg: 'bg-emerald-700',
        inputText: 'text-emerald-50',
        inputBorder: 'border-emerald-600',
        inputPlaceholder: 'placeholder-emerald-400/50',
    },
    sunset: {
        name: 'Sunset',
        bg: 'bg-gradient-to-br from-orange-900 to-rose-900',
        header: 'bg-orange-950/80 backdrop-blur-sm border-b border-orange-700',
        headerText: 'text-orange-50',
        accentBg: 'bg-orange-500',
        accentText: 'text-orange-400',
        card: 'bg-orange-800 border-l-4 border-orange-500 shadow-lg hover:shadow-orange-500/20',
        list: 'bg-orange-800/50',
        listTitle: 'text-orange-300 font-semibold',
        button: 'bg-orange-600 hover:bg-orange-700 text-white',
        buttonSecondary: 'bg-orange-700 hover:bg-orange-600 text-orange-100',
        inputBg: 'bg-orange-700',
        inputText: 'text-orange-50',
        inputBorder: 'border-orange-600',
        inputPlaceholder: 'placeholder-orange-400/50',
    },
    purple: {
        name: 'Purple',
        bg: 'bg-gradient-to-br from-indigo-900 to-purple-900',
        header: 'bg-indigo-950/80 backdrop-blur-sm border-b border-indigo-700',
        headerText: 'text-indigo-50',
        accentBg: 'bg-purple-500',
        accentText: 'text-purple-400',
        card: 'bg-indigo-800 border-l-4 border-purple-500 shadow-lg hover:shadow-purple-500/20',
        list: 'bg-indigo-800/50',
        listTitle: 'text-purple-300 font-semibold',
        button: 'bg-purple-600 hover:bg-purple-700 text-white',
        buttonSecondary: 'bg-indigo-700 hover:bg-indigo-600 text-purple-100',
        inputBg: 'bg-indigo-700',
        inputText: 'text-purple-50',
        inputBorder: 'border-indigo-600',
        inputPlaceholder: 'placeholder-purple-400/50',
    },
};

export default function Board({ board, onUpdate }) {
    const [lists, setLists] = useState(board.lists || []);
    const [theme, setTheme] = useState(() => {
        // Load theme from localStorage or default to 'dark'
        const savedTheme = localStorage.getItem('appTheme');
        // Validate that the saved theme exists
        return (savedTheme && THEMES[savedTheme]) ? savedTheme : 'dark';
    });

    // Save theme to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('appTheme', theme);
    }, [theme]);

    // Listen for theme changes from Electron menu
    useEffect(() => {
        try {
            const { ipcRenderer } = window.require?.('electron') || {};
            if (ipcRenderer) {
                const handleThemeChange = (themeKey) => {
                    // Validate theme exists before setting
                    if (THEMES[themeKey]) {
                        setTheme(themeKey);
                    }
                };
                ipcRenderer.on('set-theme', handleThemeChange);
                return () => {
                    ipcRenderer.removeListener('set-theme', handleThemeChange);
                };
            }
        } catch (error) {
            // Not in Electron context or ipcRenderer not available
        }
    }, []);

    useEffect(() => {
        setLists(board.lists || []);
    }, [board]);
    const [activeCard, setActiveCard] = useState(null);
    const [newListTitle, setNewListTitle] = useState('');
    const [isAddingList, setIsAddingList] = useState(false);
    const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
    const [boardTitle, setBoardTitle] = useState(board.title);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event) => {
        const { active } = event;
        const card = lists
            .flatMap((list) => list.cards)
            .find((c) => c.id === active.id);
        setActiveCard(card);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) {
            setActiveCard(null);
            return;
        }

        const activeCardId = active.id;
        const overId = over.id;

        // Find source list (card is always from a list)
        const sourceList = lists.find((list) => list.cards.some((c) => c.id === activeCardId));
        if (!sourceList) {
            setActiveCard(null);
            return;
        }

        const sourceCardIndex = sourceList.cards.findIndex((c) => c.id === activeCardId);
        const card = sourceList.cards[sourceCardIndex];

        // Determine target list and position
        let targetList = null;
        let newPosition = 0;

        // First, check if over is a list container
        const overList = lists.find((l) => l.id === overId);
        if (overList) {
            // Dropped on list container
            targetList = overList;
            newPosition = targetList.cards.length;
        } else {
            // Dropped on a card, find its list
            targetList = lists.find((list) => list.cards.some((c) => c.id === overId));
            if (targetList) {
                const overCardIndex = targetList.cards.findIndex((c) => c.id === overId);
                newPosition = overCardIndex >= 0 ? overCardIndex : targetList.cards.length;
            }
        }

        if (!targetList) {
            setActiveCard(null);
            return;
        }

        // If same list and same position, do nothing
        if (sourceList.id === targetList.id && sourceCardIndex === newPosition) {
            setActiveCard(null);
            return;
        }

        // Update state optimistically
        const newLists = lists.map((list) => {
            if (list.id === sourceList.id && list.id === targetList.id) {
                // Same list reordering
                const newCards = Array.from(list.cards);
                const [movedCard] = newCards.splice(sourceCardIndex, 1);
                newCards.splice(newPosition, 0, movedCard);
                return { ...list, cards: newCards };
            } else if (list.id === sourceList.id) {
                // Removing from source list
                return {
                    ...list,
                    cards: list.cards.filter((c) => c.id !== activeCardId)
                };
            } else if (list.id === targetList.id) {
                // Adding to target list
                const newCards = [...list.cards];
                const movedCard = { ...card, list_id: targetList.id };
                newCards.splice(newPosition, 0, movedCard);
                return { ...list, cards: newCards };
            }
            return list;
        });

        setLists(newLists);
        setActiveCard(null);

        // Update backend
        try {
            await moveCard(card.id, targetList.id, newPosition);
        } catch (error) {
            console.error('Failed to move card:', error);
            // Revert on error
            if (onUpdate) onUpdate();
        }
    };

    const handleAddList = async (e) => {
        e.preventDefault();
        if (newListTitle.trim()) {
            const newList = await createList(board.id, newListTitle.trim());
            setLists([...lists, { ...newList, cards: [] }]);
            setNewListTitle('');
            setIsAddingList(false);
        }
    };

    const handleUpdateBoardTitle = async () => {
        if (boardTitle.trim() && boardTitle.trim() !== board.title) {
            await updateBoard(board.id, boardTitle.trim());
            if (onUpdate) onUpdate();
        }
        setIsEditingBoardTitle(false);
    };

    // Get current theme with fallback to 'dark'
    const currentTheme = THEMES[theme] || THEMES.dark;

    return (
        <div className={`h-screen flex flex-col ${currentTheme.bg}`}>
            <header className={`${currentTheme.header}`}>
                <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                        {isEditingBoardTitle ? (
                            <input
                                type="text"
                                value={boardTitle}
                                onChange={(e) => setBoardTitle(e.target.value)}
                                onBlur={handleUpdateBoardTitle}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateBoardTitle();
                                    if (e.key === 'Escape') {
                                        setBoardTitle(board.title);
                                        setIsEditingBoardTitle(false);
                                    }
                                }}
                                className={`text-2xl font-bold px-3 py-2 rounded border-2 focus:outline-none ${currentTheme.accentText} border-current/30 focus:border-current/60 bg-white/10 placeholder-current/50`}
                                autoFocus
                            />
                        ) : (
                            <h1
                                className={`text-2xl font-bold ${currentTheme.headerText} cursor-pointer hover:bg-white/10 px-3 py-2 rounded inline-block transition-colors`}
                                onClick={() => setIsEditingBoardTitle(true)}
                            >
                                {board.title}
                            </h1>
                        )}
                    </div>
                </div>
            </header>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto p-4">
                    <div className="flex gap-4 h-full">
                        {lists.map((list) => (
                            <List
                                key={list.id}
                                list={list}
                                onUpdate={onUpdate}
                            />
                        ))}

                        {isAddingList ? (
                            <div className={`${currentTheme.list} rounded-lg p-3 w-80 flex-shrink-0`}>
                                <form onSubmit={handleAddList}>
                                    <input
                                        type="text"
                                        value={newListTitle}
                                        onChange={(e) => setNewListTitle(e.target.value)}
                                        placeholder="Enter list title..."
                                        className={`w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentTheme.inputBg} ${currentTheme.inputText} ${currentTheme.inputBorder} ${currentTheme.inputPlaceholder} border`}
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            type="submit"
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentTheme.button}`}
                                        >
                                            Add List
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddingList(false);
                                                setNewListTitle('');
                                            }}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentTheme.buttonSecondary}`}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingList(true)}
                                className={`${currentTheme.list} rounded-lg p-3 w-80 flex-shrink-0 font-medium transition-colors hover:brightness-110 ${currentTheme.listTitle}`}
                            >
                                + Add another list
                            </button>
                        )}
                    </div>
                </div>

                <DragOverlay>
                    {activeCard ? <Card card={activeCard} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
