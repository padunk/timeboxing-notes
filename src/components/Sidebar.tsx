import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "react-aria-components";
import { supabase } from "@/lib/supabase";

interface SidebarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

interface DateNode {
  type: "year" | "month" | "date";
  value: string;
  label: string;
  count?: number;
  children?: DateNode[];
}

export function Sidebar({ selectedDate, onDateSelect }: SidebarProps) {
  const { user } = useAuth();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [dateTree, setDateTree] = useState<DateNode[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDateTree = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load timeboxes for the next 3 months
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const { data: timeboxes, error } = await supabase
        .from("timeboxes")
        .select("date, note_id")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0]);

      if (error) throw error;

      // Group timeboxes by date
      const dateCount: Record<string, number> = {};
      timeboxes?.forEach((timebox) => {
        dateCount[timebox.date] = (dateCount[timebox.date] || 0) + 1;
      });

      // Build tree structure
      const tree = buildDateTree(startDate, endDate, dateCount);
      setDateTree(tree);
    } catch (error) {
      console.error("Error loading date tree:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDateTree();
  }, [loadDateTree]);

  useEffect(() => {
    // Auto-expand to current date
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = `${year}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    setExpandedNodes(new Set([year, month]));
  }, []);

  const buildDateTree = (
    startDate: Date,
    endDate: Date,
    dateCount: Record<string, number>,
  ): DateNode[] => {
    const tree: DateNode[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const year = current.getFullYear().toString();
      const monthNum = current.getMonth();
      const monthKey = `${year}-${String(monthNum + 1).padStart(2, "0")}`;
      const monthLabel = current.toLocaleDateString("en-US", { month: "long" });
      const dateKey = current.toISOString().split("T")[0];
      const dateLabel = current.toLocaleDateString("en-US", {
        day: "numeric",
        weekday: "short",
      });

      // Find or create year node
      let yearNode = tree.find((n) => n.value === year);
      if (!yearNode) {
        yearNode = { type: "year", value: year, label: year, children: [] };
        tree.push(yearNode);
      }

      // Find or create month node
      let monthNode = yearNode.children?.find((n) => n.value === monthKey);
      if (!monthNode) {
        monthNode = {
          type: "month",
          value: monthKey,
          label: monthLabel,
          children: [],
        };
        yearNode.children?.push(monthNode);
      }

      // Add date node
      const count = dateCount[dateKey] || 0;
      monthNode.children?.push({
        type: "date",
        value: dateKey,
        label: dateLabel,
        count,
      });

      current.setDate(current.getDate() + 1);
    }

    return tree;
  };

  const toggleNode = (nodeValue: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeValue)) {
        next.delete(nodeValue);
      } else {
        next.add(nodeValue);
      }
      return next;
    });
  };

  const createNewNote = async () => {
    if (!user?.id) return;

    try {
      // Create a new note for tomorrow by default
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split("T")[0];

      const { data: note, error: noteError } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: "New Note",
          content: "",
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // Create a default timebox for the note (9 AM - 10 AM)
      const { error: timeboxError } = await supabase.from("timeboxes").insert({
        user_id: user.id,
        note_id: note.id,
        date: selectedDate || tomorrowDate,
        start_time: "09:00:00",
        end_time: "10:00:00",
      });

      if (timeboxError) throw timeboxError;

      // Reload the tree
      await loadDateTree();

      // Select the date where the note was created
      onDateSelect(selectedDate || tomorrowDate);
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const renderTree = (nodes: DateNode[], level = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedNodes.has(node.value);
      const isSelected = node.type === "date" && node.value === selectedDate;
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.value} style={{ paddingLeft: `${level * 16}px` }}>
          <button
            onClick={() => {
              if (node.type === "date") {
                onDateSelect(node.value);
              } else if (hasChildren) {
                toggleNode(node.value);
              }
            }}
            className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isSelected
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {hasChildren && (
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {!hasChildren && <span className="w-4" />}
            <span className="flex-1 font-medium">{node.label}</span>
            {node.count !== undefined && node.count > 0 && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                {node.count}
              </span>
            )}
          </button>
          {isExpanded && hasChildren && (
            <div>{renderTree(node.children!, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button
          onPress={createNewNote}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Note
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Loading...
          </p>
        ) : dateTree.length > 0 ? (
          renderTree(dateTree)
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No notes yet. Create your first note!
          </p>
        )}
      </div>
    </div>
  );
}
