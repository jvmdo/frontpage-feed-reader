"use client";

import {
  ColorPicker as ArkColorPicker,
  type ColorPickerRootProps,
  parseColor,
} from "@ark-ui/react/color-picker";
import { Check } from "lucide-react";
import { DEFAULT_CATEGORY_COLOR } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

export interface ColorPickerProps
  extends Omit<ColorPickerRootProps, "value" | "onValueChange"> {
  value?: string;
  onValueChange?: (details: { value: string }) => void;
  presets?: string[];
}

export function ColorPicker({
  value,
  onValueChange,
  presets = [
    DEFAULT_CATEGORY_COLOR,
    "#dc2626",
    "#16a34a",
    "#d97706",
    "#7c3aed",
    "#db2777",
    "#0891b2",
    "#4b5563",
  ],
  className,
  ...props
}: ColorPickerProps) {
  return (
    <ArkColorPicker.Root
      value={value ? parseColor(value) : undefined}
      onValueChange={(details) =>
        onValueChange?.({ value: details.value.toString("hex") })
      }
      closeOnSelect
      {...props}
    >
      <div className={cn("flex flex-col gap-2", className)}>
        <ArkColorPicker.Control className="flex gap-2">
          <ArkColorPicker.Trigger asChild>
            <Button variant="outline" className="w-full justify-start px-2">
              <ArkColorPicker.ValueSwatch asChild>
                <div
                  className="h-2.5 w-full rounded-sm border border-border/50 shadow-xs"
                  style={{ backgroundColor: value || DEFAULT_CATEGORY_COLOR }}
                />
              </ArkColorPicker.ValueSwatch>
            </Button>
          </ArkColorPicker.Trigger>
        </ArkColorPicker.Control>

        <ArkColorPicker.Positioner>
          <ArkColorPicker.Content className="z-50 w-60 rounded-md border bg-popover p-3 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            <div className="flex flex-col gap-4">
              {/* Color Area / Palette */}
              <ArkColorPicker.Area className="relative h-32 w-full rounded-md border border-border">
                <ArkColorPicker.AreaBackground className="h-full w-full rounded-md" />
                <ArkColorPicker.AreaThumb className="z-10 size-4 rounded-full border-2 border-white shadow-sm ring-1 ring-black/20 focus-visible:ring-2 focus-visible:ring-ring" />
              </ArkColorPicker.Area>

              <div className="flex flex-col gap-3">
                {/* Hue Slider */}
                <ArkColorPicker.ChannelSlider
                  channel="hue"
                  className="relative h-3 w-full rounded-full border border-border"
                >
                  <ArkColorPicker.ChannelSliderTrack className="h-full w-full rounded-full" />
                  <ArkColorPicker.ChannelSliderThumb className="top-1/2 -translate-y-1/2 z-10 size-4 rounded-full border-2 border-white shadow-sm ring-1 ring-black/20 focus-visible:ring-2 focus-visible:ring-ring" />
                </ArkColorPicker.ChannelSlider>

                {/* Hex Input */}
                <ArkColorPicker.ChannelInput channel="hex" asChild>
                  <Input className="h-8 text-xs uppercase" />
                </ArkColorPicker.ChannelInput>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground/70 tracking-wider">
                  Presets
                </span>
                <ArkColorPicker.SwatchGroup className="grid grid-cols-4 gap-2">
                  {presets.map((preset) => (
                    <ArkColorPicker.SwatchTrigger
                      key={preset}
                      value={preset}
                      aria-label={preset}
                      className="relative size-8 cursor-pointer rounded-md border border-border transition-transform hover:scale-110 active:scale-95"
                    >
                      <ArkColorPicker.Swatch
                        value={preset}
                        className="size-full rounded-md"
                      >
                        <ArkColorPicker.SwatchIndicator className="absolute inset-0 flex items-center justify-center">
                          <Check className="size-4 text-white drop-shadow-sm" />
                        </ArkColorPicker.SwatchIndicator>
                      </ArkColorPicker.Swatch>
                    </ArkColorPicker.SwatchTrigger>
                  ))}
                </ArkColorPicker.SwatchGroup>
              </div>
            </div>
          </ArkColorPicker.Content>
        </ArkColorPicker.Positioner>
        <ArkColorPicker.HiddenInput />
      </div>
    </ArkColorPicker.Root>
  );
}
