<script setup lang="ts">
import { computed, reactive } from "vue";
import { useRouter } from "vue-router";

defineOptions({
  name: "IndexPage",
});

const router = useRouter();

const iconMap: Record<string, string> = {
  "01.geometry-lab": "◢",
};

const pages = computed(() => {
  return router
    .getRoutes()
    .filter((route) => route.path !== "/" && route.path !== "/:all(.*)")
    .map((route) => {
      const slug = route.path.replace(/^\//, "");

      return {
        name: slug,
        path: route.path,
        label: slug
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase()),
        icon: iconMap[slug] || "◆",
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
});

function getPreviewSrc(slug: string) {
  return `${import.meta.env.BASE_URL}previews/${slug}.png`;
}

const previewFailed = reactive<Record<string, boolean>>({});

function handlePreviewError(slug: string) {
  previewFailed[slug] = true;
}
</script>

<template>
  <main class="min-h-dvh overflow-hidden bg-zinc-950 text-zinc-100">
    <!-- background -->
    <div
      class="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_35%)]"
    />

    <section class="relative mx-auto max-w-7xl px-6 py-14 md:px-10">
      <!-- header -->
      <header class="mb-14 flex flex-col gap-5">
        <div
          class="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500 backdrop-blur"
        >
          <span class="h-2 w-2 rounded-full bg-emerald-400" />
          Playground
        </div>

        <div class="space-y-3">
          <div class="flex items-end gap-4">
            <h1
              class="text-4xl font-black tracking-[-0.08em] text-zinc-50 md:text-6xl"
            >
              Experiments
            </h1>

            <a
              href="https://github.com/hetari/threejs-learn"
              target="_blank"
              rel="noopener noreferrer"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/70 text-zinc-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-600 hover:text-zinc-100 hover:shadow-lg hover:shadow-zinc-900/50"
              title="View on GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
              </svg>
            </a>
          </div>

          <p class="max-w-xl text-sm leading-7 text-zinc-500 md:text-base">
            Interactive route previews with live rendering.
          </p>
        </div>
      </header>

      <!-- grid -->
      <section
        v-if="pages.length"
        class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        <router-link
          v-for="page in pages"
          :key="page.path"
          :to="page.path"
          class="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700"
        >
          <!-- top -->
          <div
            class="relative flex items-center justify-between border-b border-zinc-800 px-5 py-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 text-sm font-bold text-zinc-200"
              >
                {{ page.icon }}
              </div>

              <div class="flex flex-col">
                <span class="text-sm font-semibold text-zinc-100">
                  {{ page.label }}
                </span>

                <span class="text-xs text-zinc-500">
                  {{ page.path }}
                </span>
              </div>
            </div>

            <div
              class="text-zinc-600 transition-all duration-300 group-hover:translate-x-1 group-hover:text-zinc-300"
            >
              →
            </div>
          </div>

          <!-- preview -->
          <div class="relative aspect-[16/10] overflow-hidden bg-black">
            <img
              v-if="!previewFailed[page.name]"
              :src="getPreviewSrc(page.name)"
              :alt="`${page.label} preview`"
              loading="lazy"
              class="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
              @error="handlePreviewError(page.name)"
            />

            <div
              v-else
              class="flex h-full w-full items-center justify-center border-t border-zinc-800 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%),linear-gradient(180deg,rgba(24,24,27,0.9),rgba(9,9,11,1))] px-6 text-center"
            >
              <div class="space-y-2">
                <div
                  class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900/80 text-xl font-black text-zinc-200"
                >
                  {{ page.icon }}
                </div>

                <p class="text-sm font-semibold tracking-wide text-zinc-100">
                  {{ page.label }}
                </p>

                <p class="text-xs text-zinc-500">
                  Drop a screenshot at
                  <span class="text-zinc-300">{{
                    getPreviewSrc(page.name)
                  }}</span>
                </p>
              </div>
            </div>

            <div
              class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(9,9,11,0.72),rgba(9,9,11,0.1)_55%,transparent)]"
            />
          </div>
        </router-link>
      </section>

      <!-- empty -->
      <div
        v-else
        class="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 text-sm text-zinc-500"
      >
        No pages found in src/pages
      </div>
    </section>
  </main>
</template>
