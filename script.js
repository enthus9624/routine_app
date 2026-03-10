const STORAGE_KEY = "routine-flow-calendar-v5";
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const seedPlans = [
  { id: crypto.randomUUID(), title: "헬스장 가기", category: "Health", startDate: "2026-03-10", repeatType: "weekly", intervalDays: 1 },
  { id: crypto.randomUUID(), title: "가계부 정리", category: "Life", startDate: "2026-03-12", repeatType: "monthly", intervalDays: 1 },
  { id: crypto.randomUUID(), title: "영어 회화 복습", category: "Study", startDate: "2026-03-11", repeatType: "daily", intervalDays: 1 },
  { id: crypto.randomUUID(), title: "분기 목표 점검", category: "Work", startDate: "2026-03-20", repeatType: "quarterly", intervalDays: 1 },
  { id: crypto.randomUUID(), title: "물 마시기 체크", category: "Health", startDate: "2026-03-10", repeatType: "interval", intervalDays: 3 }
];

const form = document.querySelector("#schedule-form");
const titleInput = document.querySelector("#schedule-title");
const dateInput = document.querySelector("#schedule-date");
const categoryInput = document.querySelector("#schedule-category");
const repeatTypeInput = document.querySelector("#repeat-type");
const intervalPicker = document.querySelector("#interval-picker");
const intervalDaysInput = document.querySelector("#interval-days");
const openComposerButton = document.querySelector("#open-composer");
const closeComposerButton = document.querySelector("#close-composer");
const composerPanel = document.querySelector("#composer-panel");
const copyBar = document.querySelector("#copy-bar");
const copyLabel = document.querySelector("#copy-label");
const copyHelp = document.querySelector("#copy-help");
const clearCopyDatesButton = document.querySelector("#clear-copy-dates");
const pasteCopyButton = document.querySelector("#paste-copy");
const calendarTitle = document.querySelector("#calendar-title");
const calendarGrid = document.querySelector("#calendar-grid");
const prevMonthButton = document.querySelector("#prev-month");
const nextMonthButton = document.querySelector("#next-month");
const todayButton = document.querySelector("#today-button");
const detailModal = document.querySelector("#detail-modal");
const detailBackdrop = document.querySelector("#detail-backdrop");
const closeDetailButton = document.querySelector("#close-detail");
const detailTitle = document.querySelector("#detail-title");
const detailDate = document.querySelector("#detail-date");
const detailRepeat = document.querySelector("#detail-repeat");
const detailCategory = document.querySelector("#detail-category");
const detailToggleButton = document.querySelector("#detail-toggle");
const detailEditButton = document.querySelector("#detail-edit");
const detailCopyButton = document.querySelector("#detail-copy");
const detailDeleteButton = document.querySelector("#detail-delete");
const deleteModal = document.querySelector("#delete-modal");
const deleteBackdrop = document.querySelector("#delete-backdrop");
const closeDeleteButton = document.querySelector("#close-delete");
const deleteCopy = document.querySelector("#delete-copy");
const deleteOnceButton = document.querySelector("#delete-once");
const deleteAllButton = document.querySelector("#delete-all");

const today = getTodayString();
let state = loadState();

dateInput.value = state.selectedDate;
toggleOptionInputs();
render();

function defaultState() {
  return {
    plans: seedPlans,
    completions: {},
    exclusions: {},
    selectedDate: today,
    monthCursor: today.slice(0, 7),
    copiedPlanId: null,
    copyTargetDates: [],
    modalPlanId: null,
    modalDate: null,
    editingPlanId: null,
    deletePlanId: null,
    deleteDate: null
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      plans: Array.isArray(parsed.plans) ? parsed.plans : seedPlans,
      completions: parsed.completions && typeof parsed.completions === "object" ? parsed.completions : {},
      exclusions: parsed.exclusions && typeof parsed.exclusions === "object" ? parsed.exclusions : {},
      selectedDate: typeof parsed.selectedDate === "string" ? parsed.selectedDate : today,
      monthCursor: typeof parsed.monthCursor === "string" ? parsed.monthCursor : today.slice(0, 7),
      copiedPlanId: typeof parsed.copiedPlanId === "string" ? parsed.copiedPlanId : null,
      copyTargetDates: Array.isArray(parsed.copyTargetDates) ? parsed.copyTargetDates : [],
      modalPlanId: typeof parsed.modalPlanId === "string" ? parsed.modalPlanId : null,
      modalDate: typeof parsed.modalDate === "string" ? parsed.modalDate : null,
      editingPlanId: typeof parsed.editingPlanId === "string" ? parsed.editingPlanId : null,
      deletePlanId: typeof parsed.deletePlanId === "string" ? parsed.deletePlanId : null,
      deleteDate: typeof parsed.deleteDate === "string" ? parsed.deleteDate : null
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setComposerOpen(isOpen) {
  composerPanel.classList.toggle("is-collapsed", !isOpen);
}

function render() {
  renderCopyBar();
  renderCalendar();
  renderDetailModal();
  renderDeleteModal();
  saveState();
}

function renderCopyBar() {
  const copiedPlan = getCopiedPlan();
  copyBar.hidden = !copiedPlan;
  if (!copiedPlan) return;
  copyLabel.textContent = `복사됨: ${copiedPlan.title}`;
  copyHelp.textContent = state.copyTargetDates.length > 0
    ? `${state.copyTargetDates.length}개 날짜 선택됨`
    : "캘린더에서 날짜를 여러 개 선택하세요.";
}

function renderCalendar() {
  const { year, monthIndex } = parseMonthCursor(state.monthCursor);
  calendarTitle.textContent = `${year}년 ${monthIndex + 1}월`;
  calendarGrid.innerHTML = "";

  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = firstDay.getDay();
  const gridStart = new Date(year, monthIndex, 1 - startOffset);

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);
    const dateString = toDateString(current);
    const duePlans = getPlansForDate(dateString);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-button";
    button.addEventListener("click", () => handleDayClick(dateString));
    if (dateString.slice(0, 7) !== state.monthCursor) button.classList.add("is-outside");
    if (dateString === state.selectedDate) button.classList.add("is-selected");
    if (dateString === today) button.classList.add("is-today");
    if (state.copyTargetDates.includes(dateString)) button.classList.add("is-copy-target");

    const header = document.createElement("span");
    header.className = "day-number";
    header.textContent = String(current.getDate());

    const events = document.createElement("div");
    events.className = "day-events";
    duePlans.slice(0, 5).forEach((plan) => {
      const eventRow = document.createElement("div");
      eventRow.className = "day-event";
      if (isCompletedOnDate(plan.id, dateString)) eventRow.classList.add("is-done");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "day-event-check";
      checkbox.checked = isCompletedOnDate(plan.id, dateString);
      checkbox.addEventListener("click", (event) => event.stopPropagation());
      checkbox.addEventListener("change", (event) => {
        event.stopPropagation();
        toggleCompletion(plan.id, dateString);
      });

      const titleButton = document.createElement("button");
      titleButton.type = "button";
      titleButton.className = "day-event-title";
      titleButton.textContent = plan.title;
      titleButton.title = `${plan.title} · ${formatRepeatLabel(plan)}`;
      titleButton.addEventListener("click", (event) => {
        event.stopPropagation();
        openDetailModal(plan.id, dateString);
      });

      eventRow.append(checkbox, titleButton);
      events.appendChild(eventRow);
    });

    if (duePlans.length > 5) {
      const more = document.createElement("span");
      more.className = "day-more";
      more.textContent = `+${duePlans.length - 5}개 더`;
      events.appendChild(more);
    }

    button.append(header, events);
    calendarGrid.appendChild(button);
  }
}

function renderDetailModal() {
  const plan = getModalPlan();
  detailModal.hidden = !plan || !state.modalDate;
  if (!plan || !state.modalDate) return;
  detailTitle.textContent = plan.title;
  detailDate.textContent = `날짜: ${formatDateLabel(state.modalDate)}`;
  detailRepeat.textContent = `반복: ${formatRepeatLabel(plan)}`;
  detailCategory.textContent = `카테고리: ${plan.category}`;
  detailToggleButton.textContent = isCompletedOnDate(plan.id, state.modalDate) ? "완료 해제" : "완료 처리";
}

function renderDeleteModal() {
  const plan = state.plans.find((item) => item.id === state.deletePlanId) || null;
  deleteModal.hidden = !plan || !state.deleteDate;
  if (!plan || !state.deleteDate) return;
  const recurring = plan.repeatType !== "none";
  deleteCopy.textContent = recurring
    ? "이번 일정만 삭제할지, 반복 전체를 삭제할지 선택하세요."
    : "이 일정은 한 번만 등록된 일정입니다. 삭제하면 완전히 제거됩니다.";
  deleteOnceButton.hidden = !recurring;
}

function handleDayClick(dateString) {
  if (state.copiedPlanId) return toggleCopyTargetDate(dateString);
  state.selectedDate = dateString;
  state.monthCursor = dateString.slice(0, 7);
  dateInput.value = dateString;
  state.editingPlanId = null;
  resetFormFields();
  setComposerOpen(true);
  titleInput.focus();
  render();
}

function toggleCopyTargetDate(dateString) {
  if (state.copyTargetDates.includes(dateString)) {
    state.copyTargetDates = state.copyTargetDates.filter((value) => value !== dateString);
  } else {
    state.copyTargetDates = [...state.copyTargetDates, dateString].sort();
  }
  render();
}

function addPlan(title, category, startDate, repeatType) {
  state.plans.unshift(buildPlan(title, category, startDate, repeatType));
  state.selectedDate = startDate;
  state.monthCursor = startDate.slice(0, 7);
  dateInput.value = startDate;
  state.editingPlanId = null;
  setComposerOpen(false);
  render();
}

function updatePlan(planId, title, category, startDate, repeatType) {
  state.plans = state.plans.map((plan) => (
    plan.id === planId ? { ...buildPlan(title, category, startDate, repeatType), id: plan.id } : plan
  ));
  state.selectedDate = startDate;
  state.monthCursor = startDate.slice(0, 7);
  dateInput.value = startDate;
  state.editingPlanId = null;
  setComposerOpen(false);
  render();
}

function buildPlan(title, category, startDate, repeatType) {
  return {
    id: crypto.randomUUID(),
    title,
    category,
    startDate,
    repeatType,
    intervalDays: Math.max(1, Number(intervalDaysInput.value) || 1)
  };
}

function startEditPlan(planId) {
  const plan = state.plans.find((item) => item.id === planId);
  if (!plan) return;
  state.editingPlanId = planId;
  titleInput.value = plan.title;
  dateInput.value = plan.startDate;
  categoryInput.value = plan.category;
  repeatTypeInput.value = plan.repeatType;
  intervalDaysInput.value = String(Math.max(1, Number(plan.intervalDays) || 1));
  toggleOptionInputs();
  closeDetailModal();
  setComposerOpen(true);
  titleInput.focus();
}

function deletePlan(id) {
  state.plans = state.plans.filter((plan) => plan.id !== id);
  cleanupPlanState(id);
  closeDeleteModal(false);
  closeDetailModal(false);
  render();
}

function deleteSingleOccurrence(id, dateString) {
  state.exclusions[dateString] = { ...(state.exclusions[dateString] || {}), [id]: true };
  if (state.completions[dateString]?.[id] !== undefined) {
    delete state.completions[dateString][id];
    if (Object.keys(state.completions[dateString]).length === 0) delete state.completions[dateString];
  }
  closeDeleteModal(false);
  closeDetailModal(false);
  render();
}

function cleanupPlanState(id) {
  Object.keys(state.completions).forEach((dateString) => {
    if (state.completions[dateString]?.[id] === undefined) return;
    delete state.completions[dateString][id];
    if (Object.keys(state.completions[dateString]).length === 0) delete state.completions[dateString];
  });
  Object.keys(state.exclusions).forEach((dateString) => {
    if (state.exclusions[dateString]?.[id] === undefined) return;
    delete state.exclusions[dateString][id];
    if (Object.keys(state.exclusions[dateString]).length === 0) delete state.exclusions[dateString];
  });
  if (state.copiedPlanId === id) clearCopyMode();
  if (state.editingPlanId === id) state.editingPlanId = null;
}

function copyPlan(id) {
  state.copiedPlanId = id;
  state.copyTargetDates = [];
  setComposerOpen(false);
  closeDetailModal(false);
  render();
}

function clearCopyMode() {
  state.copiedPlanId = null;
  state.copyTargetDates = [];
}

function pasteCopiedPlan() {
  const source = getCopiedPlan();
  if (!source || state.copyTargetDates.length === 0) return;
  const dates = [...new Set(state.copyTargetDates)];
  const newPlans = dates.map((targetDate) => ({
    ...source,
    id: crypto.randomUUID(),
    startDate: targetDate,
    repeatType: "none",
    intervalDays: Math.max(1, Number(source.intervalDays) || 1)
  }));
  state.plans = [...newPlans, ...state.plans];
  state.selectedDate = dates[dates.length - 1];
  state.monthCursor = state.selectedDate.slice(0, 7);
  dateInput.value = state.selectedDate;
  clearCopyMode();
  setComposerOpen(false);
  render();
}

function openDetailModal(planId, dateString) {
  state.modalPlanId = planId;
  state.modalDate = dateString;
  render();
}

function closeDetailModal(shouldRender = true) {
  state.modalPlanId = null;
  state.modalDate = null;
  if (shouldRender) render();
}

function openDeleteModal(planId, dateString) {
  state.deletePlanId = planId;
  state.deleteDate = dateString;
  render();
}

function closeDeleteModal(shouldRender = true) {
  state.deletePlanId = null;
  state.deleteDate = null;
  if (shouldRender) render();
}

function getModalPlan() {
  return state.plans.find((plan) => plan.id === state.modalPlanId) || null;
}

function getCopiedPlan() {
  return state.plans.find((plan) => plan.id === state.copiedPlanId) || null;
}

function toggleCompletion(id, dateString) {
  const current = Boolean(state.completions[dateString]?.[id]);
  state.completions[dateString] = { ...(state.completions[dateString] || {}), [id]: !current };
  render();
}

function isCompletedOnDate(id, dateString) {
  return Boolean(state.completions[dateString]?.[id]);
}

function getPlansForDate(dateString) {
  return state.plans.filter((plan) => occursOnDate(plan, dateString));
}

function occursOnDate(plan, dateString) {
  if (dateString < plan.startDate) return false;
  if (state.exclusions[dateString]?.[plan.id]) return false;
  if (plan.repeatType === "none") return dateString === plan.startDate;
  if (plan.repeatType === "daily") return true;

  const target = new Date(`${dateString}T00:00:00`);
  const start = new Date(`${plan.startDate}T00:00:00`);

  if (plan.repeatType === "weekly") return target.getDay() === start.getDay();
  if (plan.repeatType === "monthly") return target.getDate() === start.getDate();
  if (plan.repeatType === "interval") {
    const diffDays = Math.floor((target - start) / 86400000);
    const intervalDays = Math.max(1, Number(plan.intervalDays) || 1);
    return diffDays >= 0 && diffDays % intervalDays === 0;
  }
  if (plan.repeatType === "quarterly") {
    const monthDiff = (target.getFullYear() - start.getFullYear()) * 12 + (target.getMonth() - start.getMonth());
    return monthDiff >= 0 && monthDiff % 3 === 0 && target.getDate() === start.getDate();
  }
  return false;
}

function formatRepeatLabel(plan) {
  if (plan.repeatType === "none") return "1회";
  if (plan.repeatType === "daily") return "매일";
  if (plan.repeatType === "weekly") return `매주 ${WEEKDAY_LABELS[new Date(`${plan.startDate}T00:00:00`).getDay()]}`;
  if (plan.repeatType === "monthly") return `매월 ${new Date(`${plan.startDate}T00:00:00`).getDate()}일`;
  if (plan.repeatType === "interval") return `${Math.max(1, Number(plan.intervalDays) || 1)}일마다`;
  if (plan.repeatType === "quarterly") return "매분기";
  return "";
}

function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAY_LABELS[date.getDay()]}요일`;
}

function parseMonthCursor(monthCursor) {
  const [year, month] = monthCursor.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

function toDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getTodayString() {
  return toDateString(new Date());
}

function shiftMonth(monthCursor, offset) {
  const { year, monthIndex } = parseMonthCursor(monthCursor);
  return toDateString(new Date(year, monthIndex + offset, 1)).slice(0, 7);
}

function toggleOptionInputs() {
  intervalPicker.hidden = repeatTypeInput.value !== "interval";
}

function resetFormFields() {
  form.reset();
  categoryInput.value = "Health";
  repeatTypeInput.value = "none";
  intervalDaysInput.value = "1";
  dateInput.value = state.selectedDate;
  toggleOptionInputs();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const startDate = dateInput.value;
  const repeatType = repeatTypeInput.value;
  const intervalDays = Math.max(1, Number(intervalDaysInput.value) || 1);

  if (!title) return titleInput.focus();
  if (repeatType === "interval" && intervalDays < 1) return intervalDaysInput.focus();

  if (state.editingPlanId) {
    updatePlan(state.editingPlanId, title, categoryInput.value, startDate, repeatType);
  } else {
    addPlan(title, categoryInput.value, startDate, repeatType);
  }

  resetFormFields();
  titleInput.focus();
});

repeatTypeInput.addEventListener("change", toggleOptionInputs);
prevMonthButton.addEventListener("click", () => { state.monthCursor = shiftMonth(state.monthCursor, -1); render(); });
nextMonthButton.addEventListener("click", () => { state.monthCursor = shiftMonth(state.monthCursor, 1); render(); });
todayButton.addEventListener("click", () => {
  state.selectedDate = today;
  state.monthCursor = today.slice(0, 7);
  dateInput.value = today;
  render();
});
openComposerButton.addEventListener("click", () => {
  state.editingPlanId = null;
  resetFormFields();
  setComposerOpen(true);
  titleInput.focus();
});
closeComposerButton.addEventListener("click", () => { setComposerOpen(false); });
clearCopyDatesButton.addEventListener("click", () => { clearCopyMode(); render(); });
pasteCopyButton.addEventListener("click", () => { pasteCopiedPlan(); });
detailBackdrop.addEventListener("click", () => closeDetailModal());
closeDetailButton.addEventListener("click", () => closeDetailModal());
detailToggleButton.addEventListener("click", () => {
  if (!state.modalPlanId || !state.modalDate) return;
  toggleCompletion(state.modalPlanId, state.modalDate);
});
detailEditButton.addEventListener("click", () => {
  if (!state.modalPlanId) return;
  startEditPlan(state.modalPlanId);
});
detailCopyButton.addEventListener("click", () => {
  if (!state.modalPlanId) return;
  copyPlan(state.modalPlanId);
});
detailDeleteButton.addEventListener("click", () => {
  if (!state.modalPlanId || !state.modalDate) return;
  openDeleteModal(state.modalPlanId, state.modalDate);
});
deleteBackdrop.addEventListener("click", () => closeDeleteModal());
closeDeleteButton.addEventListener("click", () => closeDeleteModal());
deleteOnceButton.addEventListener("click", () => {
  if (!state.deletePlanId || !state.deleteDate) return;
  deleteSingleOccurrence(state.deletePlanId, state.deleteDate);
});
deleteAllButton.addEventListener("click", () => {
  if (!state.deletePlanId) return;
  deletePlan(state.deletePlanId);
});
