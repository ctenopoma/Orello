import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useEffect, useRef, useState } from 'react';
import { createCard, deleteList, updateList } from '../api';
import Card from './Card';

export default function List({ list, onUpdate }) {
    const [newCardTitle, setNewCardTitle] = useState('');
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [listTitle, setListTitle] = useState(list.title);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    const { setNodeRef } = useDroppable({
        id: list.id,
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleAddCard = async (e) => {
        e.preventDefault();
        if (newCardTitle.trim()) {
            await createCard(list.id, newCardTitle.trim());
            setNewCardTitle('');
            setIsAddingCard(false);
            if (onUpdate) onUpdate();
        }
    };

    const handleUpdateTitle = async () => {
        if (listTitle.trim() && listTitle.trim() !== list.title) {
            await updateList(list.id, listTitle.trim());
            if (onUpdate) onUpdate();
        }
        setIsEditingTitle(false);
    };

    const handleDeleteList = async () => {
        if (confirm(`Delete list "${list.title}" and all its cards?`)) {
            await deleteList(list.id);
            if (onUpdate) onUpdate();
        }
        setShowMenu(false);
    };

    return (
        <div className="bg-gray-50 rounded-lg p-3 w-80 flex-shrink-0 flex flex-col max-h-full">
            <div className="flex items-center justify-between mb-3 group">
                {isEditingTitle ? (
                    <input
                        type="text"
                        value={listTitle}
                        onChange={(e) => setListTitle(e.target.value)}
                        onBlur={handleUpdateTitle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateTitle();
                            if (e.key === 'Escape') {
                                setListTitle(list.title);
                                setIsEditingTitle(false);
                            }
                        }}
                        className="flex-1 px-2 py-1 text-lg font-semibold border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                ) : (
                    <h2
                        className="text-lg font-semibold text-gray-800 flex-1 cursor-pointer hover:bg-gray-200 px-2 py-1 rounded"
                        onClick={() => setIsEditingTitle(true)}
                    >
                        {list.title}
                    </h2>
                )}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 hover:bg-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                            <button
                                onClick={() => {
                                    setIsEditingTitle(true);
                                    setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                            >
                                Edit title
                            </button>
                            <button
                                onClick={handleDeleteList}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                            >
                                Delete list
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div ref={setNodeRef} className="flex-1 min-h-[200px] overflow-y-auto">
                <SortableContext
                    items={list.cards.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {list.cards.map((card) => (
                            <Card key={card.id} card={card} onUpdate={onUpdate} />
                        ))}
                    </div>
                </SortableContext>
            </div>

            {isAddingCard ? (
                <form onSubmit={handleAddCard} className="mt-2">
                    <input
                        type="text"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        placeholder="Enter card title..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            type="submit"
                            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                        >
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsAddingCard(false);
                                setNewCardTitle('');
                            }}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setIsAddingCard(true)}
                    className="w-full mt-2 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-md text-sm text-left"
                >
                    + Add a card
                </button>
            )}
        </div>
    );
}
