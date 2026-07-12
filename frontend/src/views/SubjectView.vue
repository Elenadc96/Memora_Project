<template>
  <div class="p-4 md:p-8">

    <!-- ── Caricamento iniziale su URL lezione (refresh) ────────────── -->
    <div v-if="lessonId && store.loading" class="flex justify-center py-16">
      <p class="text-text-muted dark:text-on-surface/50">{{ $t('common.loading') }}</p>
    </div>

    <!-- ── Vista dettaglio lezione ────────────────────────────────────── -->
    <LessonPage
      v-else-if="selectedLesson"
      :lesson="selectedLesson"
      :subject-name="subject?.subjectName ?? ''"
      :subject-color="subject?.color ?? '#5FA8D3'"
      @back="goBack"
      @session-done="onLessonSessionDone"
    />

    <!-- ── Vista lista lezioni ───────────────────────────────────────── -->
    <template v-else>

      <!-- Header materia -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="flex items-center gap-4">
            <!-- Icona emoji con sfondo colorato -->
            <span
              class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              :style="{
                backgroundColor: (subject?.color ?? '#5FA8D3') + '22',
                border: `2px solid ${(subject?.color ?? '#5FA8D3')}44`,
              }"
            >{{ subject?.emoji ?? '📚' }}</span>
            <div>
              <h2 class="page-title">{{ subject?.subjectName ?? $t('common.loading') }}</h2>
              <p v-if="subject?.description" class="page-subtitle">{{ subject.description }}</p>
            </div>
          </div>

          <!-- Azioni header -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium
                     text-text-muted dark:text-on-surface/50
                     hover:text-primary dark:hover:text-on-surface
                     hover:bg-primary/5 dark:hover:bg-white/5
                     transition-all duration-150"
              @click="showEditSubject = true"
            >
              <Pencil class="w-3.5 h-3.5" />
              {{ $t('common.edit') }}
            </button>
            <button
              class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium
                     text-text-muted dark:text-on-surface/50
                     hover:text-red-500 dark:hover:text-red-400
                     hover:bg-red-500/5 dark:hover:bg-red-500/10
                     transition-all duration-150"
              @click="showDeleteSubjectConfirm = true"
            >
              <Trash2 class="w-3.5 h-3.5" />
              {{ $t('common.delete') }}
            </button>
            <button
              class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white
                     hover:brightness-90 active:brightness-75 transition-all duration-150"
              :style="{ backgroundColor: subject?.color ?? '#5FA8D3' }"
              @click="showCreateLesson = true"
            >
              <Plus class="w-4 h-4" />
              {{ $t('subject.add_lesson') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 3 stat card -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="rounded-xl border border-border bg-white dark:bg-surface p-4 flex items-center gap-3">
          <GraduationCap class="w-8 h-8 text-accent opacity-70" />
          <div>
            <p class="text-2xl font-bold text-primary dark:text-on-surface">{{ store.lessons.length }}</p>
            <p class="text-xs text-text-muted dark:text-on-surface/60">{{ $t('subject.lessons_count') }}</p>
          </div>
        </div>
        <div class="rounded-xl border border-border bg-white dark:bg-surface p-4 flex items-center gap-3">
          <Layers class="w-8 h-8 text-accent opacity-70" />
          <div>
            <p class="text-2xl font-bold text-primary dark:text-on-surface">{{ totalCards }}</p>
            <p class="text-xs text-text-muted dark:text-on-surface/60">{{ $t('subject.total_flashcards') }}</p>
          </div>
        </div>
        <div class="rounded-xl border border-border bg-white dark:bg-surface p-4 flex items-center gap-3">
          <BookOpen class="w-8 h-8 text-green-500 opacity-80" />
          <div>
            <p class="text-2xl font-bold text-primary dark:text-on-surface">
              {{ totalCards > 0 ? masteredPercent + '%' : '—' }}
            </p>
            <p class="text-xs text-text-muted dark:text-on-surface/60">{{ $t('subject.mastered_percent') }}</p>
          </div>
        </div>
      </div>

      <!-- Caricamento -->
      <div v-if="store.loading" class="flex justify-center py-16">
        <p class="text-text-muted dark:text-on-surface/50">{{ $t('common.loading') }}</p>
      </div>

      <!-- Lista lezioni -->
      <template v-else-if="store.lessons.length">

        <!-- Ricerca lezioni -->
        <div class="relative mb-6">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-on-surface/40 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('subject.search_placeholder')"
            class="input-field pl-9"
          />
        </div>

        <div v-if="filteredLessons.length" class="flex flex-col gap-3">
          <div
            v-for="lesson in filteredLessons"
            :key="lesson.id"
            class="border border-border rounded-xl p-5 hover:shadow-md cursor-pointer group
                   bg-white dark:bg-surface transition-shadow relative"
            @click="selectLesson(lesson)"
          >
            <div class="flex gap-4">
              <!-- Barra colorata sinistra -->
              <div
                class="w-1 self-stretch rounded-full flex-shrink-0"
                :style="{ backgroundColor: subject?.color ?? '#5FA8D3' }"
              />

              <div class="flex-1 min-w-0">
                <!-- Titolo + data -->
                <div class="flex items-start justify-between gap-2 mb-1">
                  <span class="font-semibold text-primary dark:text-on-surface text-sm">
                    {{ lesson.name }}
                  </span>
                  <span class="text-xs text-text-muted dark:text-on-surface/60 flex-shrink-0">
                    {{ formatLessonDate(lesson) }}
                  </span>
                </div>

                <!-- Descrizione -->
                <p
                  v-if="lesson.description"
                  class="text-xs text-text-muted dark:text-on-surface/60 mb-3 line-clamp-1"
                >
                  {{ lesson.description }}
                </p>

                <!-- Barra di progresso -->
                <div class="h-1.5 rounded-full bg-accent/10 dark:bg-white/10 mb-3">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :style="{
                      width: lessonProgressPct(lesson) + '%',
                      backgroundColor: subject?.color ?? '#5FA8D3',
                    }"
                  />
                </div>

                <!-- Chip informativi -->
                <div class="flex items-center gap-3 flex-wrap">
                  <span class="flex items-center gap-1 text-xs text-text-muted dark:text-on-surface/60">
                    <Layers class="w-3.5 h-3.5" />
                    {{ lesson.flashcardCount ?? 0 }} {{ $t('subject.chip_cards') }}
                  </span>
                  <span
                    v-if="lessonMastered(lesson) > 0"
                    class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5" />
                    {{ lessonMastered(lesson) }} {{ $t('subject.chip_mastered') }}
                  </span>
                  <span
                    v-if="lessonMastered(lesson) > 0 || lessonReview(lesson) > 0"
                    class="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium"
                  >
                    <RotateCcw class="w-3.5 h-3.5" />
                    {{ lessonReview(lesson) }} {{ $t('subject.chip_review') }}
                  </span>
                </div>
              </div>

              <!-- Azioni hover -->
              <div
                class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                @click.stop
              >
                <button
                  v-if="(lesson.flashcardCount ?? 0) > 0"
                  class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white
                         hover:brightness-90 transition-all duration-150"
                  :style="{ backgroundColor: subject?.color ?? '#5FA8D3' }"
                  @click.stop="selectLesson(lesson)"
                >
                  <Play class="w-3.5 h-3.5" />
                  {{ $t('subject.study') }}
                </button>
                <button
                  class="w-7 h-7 flex items-center justify-center rounded-lg text-red-400
                         hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-colors"
                  @click.stop="requestDeleteLesson(lesson)"
                >
                  <X class="w-4 h-4" />
                </button>
                <ChevronRight class="w-4 h-4 text-text-muted dark:text-on-surface/40" />
              </div>
            </div>
          </div>
        </div>

        <!-- Nessun risultato per la ricerca -->
        <div
          v-else
          class="border-2 border-dashed border-border rounded-xl flex flex-col items-center py-16 gap-4"
        >
          <Search class="w-10 h-10 opacity-40 text-text-muted dark:text-on-surface/40" />
          <p class="text-text-muted dark:text-on-surface/50 text-sm text-center">
            {{ $t('subject.no_search_results') }}
          </p>
        </div>
      </template>

      <!-- Stato vuoto (nessuna lezione ancora) -->
      <div
        v-else
        class="border-2 border-dashed border-border rounded-xl flex flex-col items-center py-16 gap-4"
      >
        <span class="text-5xl">{{ subject?.emoji ?? '📚' }}</span>
        <p class="text-text-muted dark:text-on-surface/50 text-sm text-center">
          {{ $t('subject.no_lessons') }}
        </p>
        <button class="btn-primary" @click="showCreateLesson = true">
          {{ $t('subject.create_first_lesson') }}
        </button>
      </div>

    </template>

    <!-- ── Dialogs ────────────────────────────────────────────────────── -->
    <CreateLessonDialog
      v-model="showCreateLesson"
      :subject-name="subject?.subjectName ?? ''"
      @created="onCreateLesson"
    />

    <ConfirmDeleteDialog
      :open="!!deleteTarget"
      title="Elimina lezione"
      description="Stai per eliminare questa lezione insieme a tutte le sue flashcard. L'operazione non è reversibile."
      :item-name="deleteTarget?.name ?? ''"
      @update:open="(v) => { if (!v) deleteTarget = null }"
      @confirm="confirmDeleteLesson"
    />

    <EditSubjectDialog
      :open="showEditSubject"
      :subject="subject"
      @update:open="showEditSubject = $event"
      @subject-updated="onSubjectUpdated"
    />

    <ConfirmDialog
      v-model="showDeleteSubjectConfirm"
      title="Elimina materia"
      :message="`Stai per eliminare &quot;${subject?.subjectName}&quot; con tutte le sue lezioni e flashcard. L'operazione è irreversibile.`"
      :danger="true"
      :confirm-label="$t('common.delete')"
      @confirm="confirmDeleteSubject"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GraduationCap, Layers, BookOpen, Plus, Pencil, Trash2, ChevronRight, Play, X, CheckCircle2, RotateCcw, Search } from 'lucide-vue-next'
import { useFlashcardStore } from '@/stores/flashcards'
import type { Lesson } from '@/types'
import { toast } from 'vue-sonner'
import LessonPage from '@/components/subject/LessonPage.vue'
import CreateLessonDialog from '@/components/subject/CreateLessonDialog.vue'
import ConfirmDeleteDialog from '@/components/subject/ConfirmDeleteDialog.vue'
import EditSubjectDialog from '@/components/subject/EditSubjectDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useFlashcardStore()

// ── Navigazione basata su route param ───────────────────────────────────
const lessonId = computed(() => {
  const p = route.params.lessonId
  return p ? Number(p) : null
})

const selectedLesson = computed<Lesson | null>(() =>
  lessonId.value ? (store.lessons.find(l => l.id === lessonId.value) ?? null) : null,
)

// ── Ricerca lezioni ──────────────────────────────────────────────────────
const searchQuery = ref('')

// ── Stato dialogs ────────────────────────────────────────────────────────
const showCreateLesson = ref(false)
const showEditSubject = ref(false)
const showDeleteSubjectConfirm = ref(false)
const deleteTarget = ref<Lesson | null>(null)

// ── Tracking locale progresso lezioni ────────────────────────────────────
const lessonProgress = ref<Record<number, { mastered: number; review: number }>>({})

// ── Computed ─────────────────────────────────────────────────────────────
const subjectId = computed(() => Number(route.params.id))
const subject = computed(() => store.subjects.find(s => s.id === subjectId.value) ?? null)

const totalCards = computed(() =>
  store.lessons.reduce((sum, l) => sum + (l.flashcardCount ?? 0), 0),
)

const filteredLessons = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return store.lessons
  return store.lessons.filter((l) =>
    l.name.toLowerCase().includes(q) || (l.description ?? '').toLowerCase().includes(q),
  )
})

const totalMastered = computed(() =>
  Object.values(lessonProgress.value).reduce((sum, p) => sum + p.mastered, 0),
)

const masteredPercent = computed(() =>
  totalCards.value > 0 ? Math.round((totalMastered.value / totalCards.value) * 100) : 0,
)

// ── Helpers ───────────────────────────────────────────────────────────────
function formatLessonDate(lesson: Lesson): string {
  const raw = lesson.last_study ?? lesson.created_at
  if (!raw) return ''
  try {
    return new Date(raw).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function lessonMastered(lesson: Lesson): number {
  return lessonProgress.value[lesson.id]?.mastered ?? lesson.mastered_count ?? 0
}

function lessonReview(lesson: Lesson): number {
  return lessonProgress.value[lesson.id]?.review ?? lesson.review_count ?? 0
}

function lessonProgressPct(lesson: Lesson): number {
  const total = lesson.flashcardCount ?? 0
  if (total === 0) return 0
  return Math.round((lessonMastered(lesson) / total) * 100)
}

// ── Navigazione ────────────────────────────────────────────────────────────
function selectLesson(lesson: Lesson) {
  router.push({ name: 'Lesson', params: { id: subjectId.value, lessonId: lesson.id } })
}

function goBack() {
  router.push({ name: 'Subject', params: { id: subjectId.value } })
}

function onLessonSessionDone({ lessonId, mastered, review }: { lessonId: number; mastered: number; review: number }) {
  lessonProgress.value = { ...lessonProgress.value, [lessonId]: { mastered, review } }
}

// ── CRUD lezioni ─────────────────────────────────────────────────────────
async function onCreateLesson(payload: { name: string; description: string; date: string }) {
  try {
    await store.createLesson({ subjectId: subjectId.value, name: payload.name, description: payload.description })
    toast.success(`Lezione "${payload.name}" creata!`)
  } catch {
    toast.error('Impossibile creare la lezione. Riprova.')
  }
}

function requestDeleteLesson(lesson: Lesson) {
  deleteTarget.value = lesson
}

async function confirmDeleteLesson() {
  if (!deleteTarget.value) return
  const name = deleteTarget.value.name
  try {
    await store.deleteLesson(deleteTarget.value.id)
    deleteTarget.value = null
    toast.success(`Lezione "${name}" eliminata.`)
  } catch {
    toast.error('Impossibile eliminare la lezione. Riprova.')
  }
}

// ── CRUD materia ─────────────────────────────────────────────────────────
async function onSubjectUpdated(payload: { name: string; description: string; color: string; emoji: string }) {
  try {
    await store.updateSubject(subjectId.value, payload)
    toast.success('Materia aggiornata.')
  } catch {
    toast.error('Impossibile modificare la materia. Riprova.')
  }
}

async function confirmDeleteSubject() {
  try {
    await store.deleteSubject(subjectId.value)
    router.push('/dashboard')
  } catch {
    toast.error('Impossibile eliminare la materia. Riprova.')
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────
// Carica prima la lista materie dell'utente (se non già in memoria) e verifica
// che l'id richiesto sia davvero una delle sue materie, PRIMA di chiedere le
// lezioni. Senza questo controllo, un id che non è dell'utente (es. digitato
// a mano nell'URL, o non ancora tuo perché la sidebar non ha ancora fetchato
// la lista) fa restare `subject` per sempre null: il titolo mostra il
// fallback "Caricamento..." a vita perché non c'è nessun altro punto che
// riprovi o segnali l'errore. Ora invece, se la materia non è nella lista,
// si avvisa l'utente e si torna alla dashboard invece di restare bloccati.
async function loadSubject(id: number) {
  if (!store.subjects.length) {
    await store.fetchSubjects()
  }
  const exists = store.subjects.some((s) => s.id === id)
  if (!exists) {
    toast.error('Materia non trovata.')
    router.replace('/dashboard')
    return
  }
  await store.selectSubject(id)
  if (lessonId.value && !selectedLesson.value) {
    router.replace({ name: 'Subject', params: { id } })
  }
}

onMounted(() => {
  loadSubject(subjectId.value)
})

watch(subjectId, (newId) => {
  loadSubject(newId)
})
</script>
