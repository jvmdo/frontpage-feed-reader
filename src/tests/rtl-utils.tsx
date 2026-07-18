import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render, renderHook } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactElement } from "react";
import { ServerTimeProvider } from "@/components/providers/server-time-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperOptions {
  searchParams?: Record<string, string>;
}

function createWrapper(options: WrapperOptions = {}) {
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NuqsTestingAdapter searchParams={options.searchParams}>
        <QueryClientProvider client={queryClient}>
          <ServerTimeProvider serverNow={new Date().toISOString()}>
            <TooltipProvider>{children}</TooltipProvider>
          </ServerTimeProvider>
        </QueryClientProvider>
      </NuqsTestingAdapter>
    );
  };
}

interface CustomRenderOptions extends RenderOptions, WrapperOptions {}

function customRender(ui: ReactElement, options: CustomRenderOptions = {}) {
  const { searchParams, wrapper, ...renderOptions } = options;

  return render(ui, {
    wrapper: wrapper ?? createWrapper({ searchParams }),
    ...renderOptions,
  });
}

function customRenderHook<TResult, TProps>(
  renderFn: (initialProps: TProps) => TResult,
  options: CustomRenderOptions = {},
) {
  const { searchParams, wrapper, ...renderOptions } = options;

  return renderHook(renderFn, {
    wrapper: wrapper ?? createWrapper({ searchParams }),
    ...renderOptions,
  });
}

export * from "@testing-library/react";
export {
  createTestQueryClient,
  customRender as render,
  customRenderHook as renderHook,
};
