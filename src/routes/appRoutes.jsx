export const routeGroups = [
  {
    label: '学习计划',
    items: [
      { path: '/dashboard', title: '首页', labels: ['今日任务', '今天的任务', '专注计时器'] },
      { path: '/plans/manage', title: '计划管理', labels: ['计划管理'] },
      { path: '/plans/add', title: '添加学习计划', labels: ['添加学习计划'] },
      { path: '/plans/ai-add', title: 'AI添加计划', labels: ['AI添加计划'] },
      { path: '/plans/batch-add', title: '批量添加计划', labels: ['批量添加计划'] },
      { path: '/plans/edit', title: '编辑学习计划', labels: ['编辑学习计划'], inferred: true },
    ],
  },
  {
    label: '习惯管理',
    items: [
      { path: '/habits/manage', title: '管理行为习惯', labels: ['管理行为习惯'] },
      { path: '/habits/checkin', title: '行为习惯打卡', labels: ['行为习惯打卡'] },
    ],
  },
  {
    label: '待办事项',
    items: [],
  },
  {
    label: '奖励系统',
    items: [
      { path: '/rewards/rules', title: '奖励规则设置', labels: ['奖励规则设置'] },
      { path: '/rewards/achievements/manage', title: '管理成就', labels: ['管理成就'] },
    ],
  },
  {
    label: '考试成绩',
    items: [
      { path: '/exams/add', title: '添加考试成绩', labels: ['添加考试成绩'] },
      { path: '/exams/ai-add', title: 'AI添加考试成绩', labels: ['AI添加考试成绩'] },
      { path: '/exams/edit', title: '编辑考试成绩', labels: ['编辑考试成绩'], inferred: true },
      { path: '/exams/subjects', title: '科目管理', labels: ['科目管理'] },
    ],
  },
  {
    label: '薄弱知识',
    items: [
      { path: '/weakness', title: '薄弱知识', labels: ['薄弱知识', '错题分析'] },
      { path: '/weakness/add', title: '提交练习记录', labels: ['提交练习记录'] },
    ],
  },
  {
    label: '系统功能',
    items: [
      { path: '/settings', title: '系统设置', labels: ['系统设置'] },
      { path: '/settings/account-password', title: '账号密码修改', labels: ['账号密码修改'] },
      { path: '/users', title: '用户管理', labels: ['用户管理', '档案管理'] },
      { path: '/export', title: '数据导出', labels: ['数据导出'], inferred: true },
      { path: '/import', title: '数据导入', labels: ['数据导入'], inferred: true },
      { path: '/install-guide', title: '安装应用到桌面', labels: ['安装应用到桌面', '查看教程'] },
    ],
  },
  {
    label: '会员相关',
    items: [
      { path: '/membership', title: '会员中心', labels: ['会员中心', '会员管理'] },
      { path: '/redeem', title: '兑换会员码', labels: ['兑换会员码', '兑换码'] },
    ],
  },
]

export const flatRoutes = routeGroups.flatMap((group) => group.items)

export const routeMap = flatRoutes.reduce((acc, route) => {
  acc[route.path] = route
  return acc
}, {})

export function getRouteMeta(pathname) {
  return routeMap[pathname] ?? null
}
