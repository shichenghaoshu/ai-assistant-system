function pad(value) {
  return String(value).padStart(2, '0')
}

export function formatDateTimeLocalValue(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function formatDateValue(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())

  return `${year}-${month}-${day}`
}

export function formatDateTime(value) {
  if (!value) {
    return '暂无时间'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '暂无时间'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDate(value) {
  if (!value) {
    return '待安排'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '待安排'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

export function splitTaskDatesText(value) {
  return String(value ?? '')
    .split(/[\n,，;；]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function joinTaskDatesText(tasks) {
  return (Array.isArray(tasks) ? tasks : [])
    .map((task) => task?.task_date)
    .filter(Boolean)
    .join('\n')
}

export function normalizePlanInput(input = {}) {
  return {
    plan_name: String(input.plan_name ?? '').trim(),
    category: String(input.category ?? '').trim(),
    repeat_type: String(input.repeat_type ?? '').trim(),
    start_time: formatDateTimeLocalValue(input.start_time),
    end_time: formatDateTimeLocalValue(input.end_time),
    taskDatesText: String(input.taskDatesText ?? '').trim(),
  }
}

export function buildTaskPayloads(profileId, planId, taskDatesText) {
  return splitTaskDatesText(taskDatesText).map((taskDate) => ({
    profile_id: profileId,
    plan_id: planId,
    task_date: taskDate,
    is_completed: false,
    completed_count: 0,
    target_count: 1,
    total_duration_seconds: 0,
    session_count: 0,
  }))
}

export function deriveDraftFromPrompt(prompt) {
  const cleanedPrompt = String(prompt ?? '').trim()
  const firstLine = cleanedPrompt.split(/\n+/)[0]?.trim() || ''
  const baseName = firstLine
    .replace(/^请/, '')
    .replace(/^帮我/, '')
    .replace(/^安排/, '')
    .replace(/^生成/, '')
    .trim()

  const planName = baseName ? `${baseName.slice(0, 12)}计划` : 'AI 草稿计划'
  const category = cleanedPrompt.includes('英语') ? '英语' : cleanedPrompt.includes('语文') ? '语文' : '综合复习'
  const repeat_type = cleanedPrompt.includes('每天')
    ? '每天'
    : cleanedPrompt.includes('每周')
      ? '每周'
      : cleanedPrompt.includes('周末')
        ? '周末'
        : '按需'
  const taskDatesText = cleanedPrompt.includes('两天')
    ? '2026-03-26\n2026-03-27'
    : cleanedPrompt.includes('三天')
      ? '2026-03-26\n2026-03-27\n2026-03-28'
      : ''

  return normalizePlanInput({
    plan_name: planName,
    category,
    repeat_type,
    taskDatesText,
  })
}

export function parseBatchPlanLine(line) {
  const parts = String(line ?? '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    return null
  }

  const [plan_name, category = '未分类', repeat_type = '按需', taskDatesText = ''] = parts

  return normalizePlanInput({
    plan_name,
    category,
    repeat_type,
    taskDatesText,
  })
}

export function parseBatchPlanInputText(text) {
  return String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseBatchPlanLine)
    .filter(Boolean)
}

