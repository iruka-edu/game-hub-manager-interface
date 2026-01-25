import React from "react";
import Link from "next/link";

interface GameListItemProps {
  game: {
    id: string;
    game_id: string;
    title: string;
    status?: string;
    created_at: string;
  };
  statusColors?: Record<string, string>;
  statusLabels?: Record<string, string>;
}

/**
 * Memoized Game List Item Component
 * Prevents unnecessary re-renders when parent updates
 */
export const MemoizedGameListItem = React.memo<GameListItemProps>(
  ({ game, statusColors, statusLabels }) => {
    const status = game.status || "draft";
    const statusColor = statusColors?.[status] || "bg-slate-100 text-slate-700";
    const statusLabel = statusLabels?.[status] || status;

    return (
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-6 py-4">
          <Link href={`/console/games/${game.id}`} className="block">
            <p className="font-medium text-slate-900 hover:text-indigo-600">
              {game.title}
            </p>
            <p className="text-sm text-slate-500">{game.game_id}</p>
          </Link>
        </td>
        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
          >
            {statusLabel}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-slate-500">
          {new Date(game.created_at).toLocaleDateString("vi-VN")}
        </td>
        <td className="px-6 py-4 text-right">
          <Link
            href={`/console/games/${game.id}`}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Chi tiết
          </Link>
        </td>
      </tr>
    );
  },
  // Custom comparison function - only re-render if game ID or status changes
  (prevProps, nextProps) => {
    return (
      prevProps.game.id === nextProps.game.id &&
      prevProps.game.status === nextProps.game.status &&
      prevProps.game.title === nextProps.game.title
    );
  },
);

MemoizedGameListItem.displayName = "MemoizedGameListItem";
