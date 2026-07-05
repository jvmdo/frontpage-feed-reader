import {
  FoldHorizontalIcon,
  TextAlignJustifyIcon,
  UnfoldHorizontalIcon,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  type ReaderWidth,
  ReaderWidthValues,
  useReaderStore,
} from "@/hooks/ui/use-reader-store";

export function ReaderWidthControls() {
  const { readerWidth, setReaderWidth } = useReaderStore();

  return (
    <ToggleGroup
      type="single"
      value={readerWidth}
      onValueChange={(val) => {
        if (val) setReaderWidth(val as ReaderWidth);
      }}
    >
      <ToggleGroupItem value={ReaderWidthValues[0]} aria-label="Narrow width">
        <FoldHorizontalIcon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value={ReaderWidthValues[1]} aria-label="Medium width">
        <TextAlignJustifyIcon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value={ReaderWidthValues[2]} aria-label="Wide width">
        <UnfoldHorizontalIcon className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
