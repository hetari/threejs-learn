<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const iconMap: Record<string, string> = {
  "geometry-lab": "◢",
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

function getPreviewUrl(path: string) {
  return `${window.location.origin}${path}`;
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
          <h1
            class="text-4xl font-black tracking-[-0.08em] text-zinc-50 md:text-6xl"
          >
            Experiments
          </h1>

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
            <iframe
              :src="getPreviewUrl(page.path)"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              tabindex="-1"
              class="pointer-events-none absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0 bg-zinc-950"
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
