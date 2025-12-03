import {
    closestCorners,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState } from 'react';
import { createList, moveCard } from '../api';
import Card from './Card';
import List from './List';

export default function Board({ board, onUpdate }) {
    const [lists, setLists] = useState(board.lists || []);
    const [activeCard, setActiveCard] = useState(null);
    const [newListTitle, setNewListTitle] = useState('');
    const [isAddingList, setIsAddingList] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
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
        const overListId = over.id;

        // Find the source list and card
        let sourceList = null;
        let cardIndex = -1;

        for (const list of lists) {
            const idx = list.cards.findIndex((c) => c.id === activeCardId);
            if (idx !== -1) {
                sourceList = list;
                cardIndex = idx;
                break;
            }
        }

        if (!sourceList) {
            setActiveCard(null);
            return;
        }

        // Find target list
        const targetList = lists.find((l) => l.id === overListId);

        if (!targetList) {
            setActiveCard(null);
            return;
        }

        // Move card
        const card = sourceList.cards[cardIndex];
        const newPosition = targetList.cards.length;

        // Update backend
        await moveCard(card.id, targetList.id, newPosition);

        // Update local state
        const updatedLists = lists.map((list) => {
            if (list.id === sourceList.id) {
                return {
                    ...list,
                    cards: list.cards.filter((c) => c.id !== activeCardId),
                };
            }
            if (list.id === targetList.id) {
                return {
                    ...list,
                    cards: [...list.cards, { ...card, list_id: targetList.id }],
                };
            }
            return list;
        });

        setLists(updatedLists);
        setActiveCard(null);
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

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-blue-600 to-purple-600">
            <header className="p-4 bg-black/20 backdrop-blur-sm">
                <h1 className="text-2xl font-bold text-white">{board.title}</h1>
            </header>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto p-4">
                    <div className="flex gap-4 h-full">
                        {lists.map((list) => (
                            <List
                                key={list.id}
                                list={list}
                                onCardCreated={() => onUpdate()}
                            />
                        ))}

                        {isAddingList ? (
                            <div className="bg-gray-50 rounded-lg p-3 w-80 flex-shrink-0">
                                <form onSubmit={handleAddList}>
                                    <input
                                        type="text"
                                        value={newListTitle}
                                        onChange={(e) => setNewListTitle(e.target.value)}
                                        placeholder="Enter list title..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            type="submit"
                                            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                                        >
                                            Add List
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddingList(false);
                                                setNewListTitle('');
                                            }}
                                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingList(true)}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 w-80 flex-shrink-0 text-white font-medium"
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
