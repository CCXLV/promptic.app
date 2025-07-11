"use client";

import React, { useState, useCallback, useRef } from "react";
import { useReactFlow, useOnViewportChange } from "@xyflow/react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CustomCursorProps {
  color?: string;
  name: string;
  liveCommentText?: string;
}

interface PresenceData {
  name?: string;
  color?: string;
  flowX?: number;
  flowY?: number;
  screenX?: number;
  screenY?: number;
  liveCommentText?: string;
  userId?: string;
  promptId?: string;
}

interface CustomCursorContainerProps {
  peers: Record<string, PresenceData>;
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
  stableUserColor: string;
}

export function CursorPointer({
  color,
  name,
  liveCommentText,
}: CustomCursorProps) {
  return (
    <div className="pointer-events-none relative max-w-[200px]">
      {/* Cursor pointer */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="absolute -top-1 -left-1"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color ?? "#3b82f6"}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      {/* Name label */}
      <span
        className={`
          ${
            liveCommentText && liveCommentText.length > 0
              ? "text-gray-500"
              : "text-gray-900"
          }
          w-max
          absolute top-5 left-2 rounded-b-xl rounded-r-xl border-2 bg-white/90 px-3 py-1 text-xs font-medium shadow-lg backdrop-blur-md dark:bg-gray-800/90 dark:text-white transition-all duration-200`}
        style={{
          borderColor: color ?? "#3b82f6",
        }}
      >
        {name}
        {liveCommentText && (
          <span className="max-w-[200px] text-xs text-gray-800 block">
            {liveCommentText}
          </span>
        )}
      </span>
    </div>
  );
}

export const CustomCursor = ({
  peers,
  reactFlowWrapper,
  stableUserColor,
}: CustomCursorContainerProps) => {
  const reactFlowInstance = useReactFlow();
  const [, setViewportKey] = useState(0);
  const lastViewportRef = useRef({ x: 0, y: 0, zoom: 1 });

  // Throttled viewport change handler to avoid excessive re-renders
  const handleViewportChange = useCallback(() => {
    const viewport = reactFlowInstance.getViewport();
    const last = lastViewportRef.current;

    // Only update if there's a meaningful change (avoids micro-movements)
    const threshold = 0.1;
    if (
      Math.abs(viewport.x - last.x) > threshold ||
      Math.abs(viewport.y - last.y) > threshold ||
      Math.abs(viewport.zoom - last.zoom) > 0.01
    ) {
      lastViewportRef.current = viewport;
      setViewportKey((prev) => prev + 1);
    }
  }, [reactFlowInstance]);

  // Use the official ReactFlow hook for viewport changes
  useOnViewportChange({
    onChange: handleViewportChange,
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[50]">
      {Object.entries(peers).map(([peerId, presence]) => {
        if (!presence.flowX || !presence.flowY) return null;

        // TODO: Show cursor when user is in fullscreen prompt editor.
        if (presence.promptId) return;

        // Get the ReactFlow viewport to calculate cursor positions
        const viewport = reactFlowInstance.getViewport();
        const containerRect = reactFlowWrapper.current?.getBoundingClientRect();

        if (!containerRect) return null;

        // Convert flow coordinates to screen coordinates within the viewport
        const screenX = presence.flowX * viewport.zoom + viewport.x;
        const screenY = presence.flowY * viewport.zoom + viewport.y;

        const arrowSize = 12;
        const chevronSize = 20; // Larger size for better visibility
        const edgeMargin = 8;

        // Check if cursor is outside viewport bounds
        const isOutsideLeft = screenX < 0;
        const isOutsideRight = screenX > containerRect.width;
        const isOutsideTop = screenY < 0;
        const isOutsideBottom = screenY > containerRect.height;
        const isOutside =
          isOutsideLeft || isOutsideRight || isOutsideTop || isOutsideBottom;

        if (isOutside) {
          // Calculate arrow position at corners/edges
          let arrowX: number, arrowY: number;
          let ChevronIcon: typeof ChevronUp = ChevronUp; // Default to ChevronUp

          if (isOutsideLeft && isOutsideTop) {
            // Top-left corner - use up chevron
            arrowX = edgeMargin;
            arrowY = edgeMargin;
            ChevronIcon = ChevronUp;
          } else if (isOutsideRight && isOutsideTop) {
            // Top-right corner - use up chevron
            arrowX = containerRect.width - edgeMargin - arrowSize;
            arrowY = edgeMargin;
            ChevronIcon = ChevronUp;
          } else if (isOutsideLeft && isOutsideBottom) {
            // Bottom-left corner - use down chevron
            arrowX = edgeMargin;
            arrowY = containerRect.height - edgeMargin - arrowSize;
            ChevronIcon = ChevronDown;
          } else if (isOutsideRight && isOutsideBottom) {
            // Bottom-right corner - use down chevron
            arrowX = containerRect.width - edgeMargin - arrowSize;
            arrowY = containerRect.height - edgeMargin - arrowSize;
            ChevronIcon = ChevronDown;
          } else if (isOutsideLeft) {
            // Left edge
            arrowX = edgeMargin;
            arrowY = Math.max(
              edgeMargin,
              Math.min(
                screenY - arrowSize / 2,
                containerRect.height - edgeMargin - arrowSize
              )
            );
            ChevronIcon = ChevronLeft;
          } else if (isOutsideRight) {
            // Right edge
            arrowX = containerRect.width - edgeMargin - arrowSize;
            arrowY = Math.max(
              edgeMargin,
              Math.min(
                screenY - arrowSize / 2,
                containerRect.height - edgeMargin - arrowSize
              )
            );
            ChevronIcon = ChevronRight;
          } else if (isOutsideTop) {
            // Top edge
            arrowX = Math.max(
              edgeMargin,
              Math.min(
                screenX - arrowSize / 2,
                containerRect.width - edgeMargin - arrowSize
              )
            );
            arrowY = edgeMargin;
            ChevronIcon = ChevronUp;
          } else if (isOutsideBottom) {
            // Bottom edge
            arrowX = Math.max(
              edgeMargin,
              Math.min(
                screenX - arrowSize / 2,
                containerRect.width - edgeMargin - arrowSize
              )
            );
            arrowY = containerRect.height - edgeMargin - arrowSize;
            ChevronIcon = ChevronDown;
          } else {
            // Fallback case
            arrowX = edgeMargin;
            arrowY = edgeMargin;
            ChevronIcon = ChevronUp;
          }

          return (
            <div
              key={peerId}
              className="absolute z-50"
              style={{
                left: arrowX,
                top: arrowY,
                width: arrowSize,
                height: arrowSize,
              }}
            >
              <ChevronIcon
                size={chevronSize}
                color={presence.color || stableUserColor}
                strokeWidth={2}
              />
            </div>
          );
        } else {
          // Cursor is within viewport - show normal cursor
          return (
            <div
              key={peerId}
              className="absolute z-50"
              style={{
                left: screenX,
                top: screenY,
                transform: "translate(-50%, -50%)",
              }}
            >
              <CursorPointer
                color={presence.color || stableUserColor}
                name={presence.name || "Anonymous"}
                liveCommentText={presence.liveCommentText}
              />
            </div>
          );
        }
      })}
    </div>
  );
};
