// src/store/creatorFlow.js
// ─────────────────────────────────────────────────────────────────────────────
// Cross-page state for the Discovery → Studio → Launch → Calendar flow.
// Persists to sessionStorage so page navigation never loses in-progress work.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useCreatorFlow = create(
  persist(
    (set, get) => ({
      // ── Selected idea from Discovery ─────────────────────────────────────
      selectedIdea: null, // full idea object from viralIdeas

      // ── Studio session ───────────────────────────────────────────────────
      studioSessionId: null,
      finalScript: null,       // { sections: [], hookLine, totalDuration }
      editedSections: [],
      ideaText: '',            // the text in the studio idea input

      // ── Launch context ───────────────────────────────────────────────────
      launchPackage: null,
      recommendedSlot: null,   // "Fri 7:30 PM IST"

      // ── Calendar entry being composed ────────────────────────────────────
      pendingCalendarEntry: null,

      // ── Actions ──────────────────────────────────────────────────────────

      setSelectedIdea: (idea) => set({
        selectedIdea: idea,
        ideaText: idea?.title || '',
        // Reset downstream state when a new idea is selected
        finalScript: null,
        editedSections: [],
        studioSessionId: null,
        launchPackage: null,
        recommendedSlot: null,
        pendingCalendarEntry: null,
      }),

      setIdeaText: (text) => set({ ideaText: text }),

      setStudioSession: (sessionId, script, sections) => set({
        studioSessionId: sessionId,
        finalScript: script,
        editedSections: sections,
      }),

      updateEditedSections: (sections) => set({ editedSections: sections }),

      setLaunchContext: (pkg, slot) => set({
        launchPackage: pkg,
        recommendedSlot: slot,
      }),

      setPendingCalendarEntry: (entry) => set({ pendingCalendarEntry: entry }),

      clearFlow: () => set({
        selectedIdea: null,
        studioSessionId: null,
        finalScript: null,
        editedSections: [],
        ideaText: '',
        launchPackage: null,
        recommendedSlot: null,
        pendingCalendarEntry: null,
      }),
    }),
    {
      name: 'aria-creator-flow',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist what's needed across navigation — skip derived state
      partialize: (state) => ({
        selectedIdea:        state.selectedIdea,
        studioSessionId:     state.studioSessionId,
        finalScript:         state.finalScript,
        editedSections:      state.editedSections,
        ideaText:            state.ideaText,
        launchPackage:       state.launchPackage,
        recommendedSlot:     state.recommendedSlot,
        pendingCalendarEntry:state.pendingCalendarEntry,
      }),
    }
  )
);

export default useCreatorFlow;
