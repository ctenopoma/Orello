import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { createCard } from '../api';
import Card from './Card';

export default function List({ list, onCardCreated }) {
    const [newCardTitle, setNewCardTitle] = useState('');
    const [isAddingCard, setIsAddingCard] = useState(false);

    const { setNodeRef } = useDroppable({
        id: list.id,
    });

    const handleAddCard = async (e) => {
        e.preventDefault();
        if (newCardTitle.trim()) {
            await createCard(list.id, newCardTitle.trim());
            setNewCardTitle('');
            setIsAddingCard(false);
            onCardCreated();
        }
    };

    return (
        <div className="bg-gray-50 rounded-lg p-3 w-80 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{list.title}</h2>

            <div ref={setNodeRef} className="min-h-[100px]">
                <SortableContext
                    items={list.cards.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {list.cards.map((card) => (
                        <Card key={card.id} card={card} />
                    ))}
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
