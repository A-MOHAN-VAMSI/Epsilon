import LineNumbers from "./LineNumbers";
import CodeLines from "./CodeLines";
import CollaboratorAvatars from "./CollaboratorAvatars";
import TypingIndicator from "./TypingIndicator";
import LiveCursor from "./LiveCursor";
import Terminal from "./Terminal";
import StatusBar from "./StatusBar";

export default function CodeWindow() {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-[#0A0F17]">
      <div className="relative flex min-h-0 flex-1 overflow-hidden bg-[#0B1018]">
        <CollaboratorAvatars />
        <LineNumbers count={30} />
        <CodeLines />
        <LiveCursor />
        <TypingIndicator />
      </div>
      <Terminal />
      <StatusBar />
    </div>
  );
}
