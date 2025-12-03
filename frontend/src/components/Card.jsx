import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function Card({ card }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move mb-2"
        >
            <h3 className="text-sm font-medium text-gray-900">{card.title}</h3>
            {card.description && (
                <p className="text-xs text-gray-600 mt-1">{card.description}</p>
            )}
        </div>
    );
}
