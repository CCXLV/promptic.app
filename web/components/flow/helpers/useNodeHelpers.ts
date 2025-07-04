import { useCallback } from "react";
import { Node, NodeChange, useReactFlow } from "@xyflow/react";
import { db } from "@/instant";
import { id } from "@instantdb/react";
import { useGlobal } from "@/lib/context/GlobalContext";
import { useFlowUpdates } from "./useFlowUpdates";

export const useNodeHelpers = ({
  nodes,
  onNodesChange,
}: {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  nodes: Node[];
  onNodesChange: (changes: NodeChange[]) => void;
}) => {
  const { fitView, screenToFlowPosition } = useReactFlow();
  const { activeProject } = useGlobal();
  const { updatePositionInDB } = useFlowUpdates();

  const focusNode = useCallback(
    (nodeId: string) => {
      fitView({
        nodes: [{ id: nodeId }],
        duration: 800,
        padding: 0.1,
      });
    },
    [fitView]
  );

  const handleCreatePromptNode = async () => {
    const newPromptId = id();
    const newPromptInformationId = id();

    // Get the center of the current viewport
    const viewportCenter = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    await db.transact([
      // Create the prompt and link it to the project
      db.tx.prompts[newPromptId].update({
        name: "New Prompt",
        content: "",
        liveContent: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
      db.tx.prompts[newPromptId].link({ project: activeProject?.id }),
      db.tx.prompt_information[newPromptInformationId].update({
        positionX: viewportCenter.x,
        promptId: newPromptId,
        positionY: viewportCenter.y,
        height: 100,
        width: 100,
        isExpanded: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nodeType: "prompt",
      }),
      db.tx.prompt_information[newPromptInformationId].link({
        prompt: newPromptId,
      }),
    ]);
  };

  // Custom onNodesChange handler to track changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        // Handle and track position changes
        if (change.type === "position" && change.position && !change.dragging) {
          // Position change completed (not dragging anymore)
          const node = nodes.find((n) => n.id === change.id);
          const nodeData = node?.data as { information: { id: string } };
          if (nodeData?.information?.id) {
            updatePositionInDB(
              change.id,
              change.position,
              nodeData.information.id
            );
          }
        }
      });

      // Apply changes to React Flow
      onNodesChange(changes);
    },
    [nodes, onNodesChange, updatePositionInDB]
  );

  return { handleCreatePromptNode, focusNode, handleNodesChange };
};
