# jh.ttxue.online Route Inventory

**Date:** 2026-03-25

**Audit basis:** Next.js App Router bundle and network inspection, plus unauthenticated live page inspection. Full authenticated browser traversal was blocked when tooling safety prevented session seeding into the browser, so this inventory is based on static analysis rather than a complete interactive walkthrough.

## Coverage Matrix

| Route | Status | Visible title / primary labels | Chunk / Evidence | Data contracts observed | Notes |
| --- | --- | --- | --- | --- | --- |
| `/auth` | Confirmed | `小打卡` / `登录` / `注册` / `忘记密码？` | `/app/auth/page-7aaea09f7907e75e.js` | `membership_types` query on load; Supabase auth | Login and register tabs visible. Install prompt can overlay. |
| `/dashboard` | Confirmed | `首页` / `今日任务` / `今天的任务` / `专注计时器` | `/app/dashboard/page-d8ea4e346fc43e25.js` | Multiple Supabase tables, RPCs, and AI endpoints | Main authenticated landing route. Labels are inferred from page strings. |
| `/plans/manage` | Confirmed | `计划管理` | `/app/plans/manage/page-20c8d9aea7222920.js` | `learning_plans`, `plan_tasks`, `plan_template_items`, `plan_templates` | Core plan management page. |
| `/plans/add` | Confirmed | `添加学习计划` | `/app/plans/add/page-eb7e597f181c55ab.js` | No obvious direct table/API strings in chunk | Add-plan page exists and is referenced in bundle. |
| `/plans/ai-add` | Confirmed | `AI添加计划` | `/app/plans/ai-add/page-1a7f0a65f9d0097b.js` | `ai_plan_*`, `custom_categories`, `learning_plans`, `plan_tasks`; `/api/ai/plan-draft`; `generate_plan_tasks` | AI-assisted plan creation. |
| `/plans/batch-add` | Confirmed | `批量添加计划` | `/app/plans/batch-add/page-6beef88d0f74f82d.js` | `learning_plans`, `membership_types`, `plan_tasks`, `redemption_records`; `/api/ai/parse-text`; `generate_plan_tasks`, `get_user_membership`, `redeem_code` | Batch flow likely gated by membership. |
| `/plans/edit` | Inferred | `编辑学习计划` | Route string only | Not directly opened; HTML 404 on direct visit | Exists in bundle, but direct page fetch returned 404. Treat as reachable through in-app navigation or conditional UI until proven otherwise. |
| `/exams/add` | Confirmed | `添加考试成绩` | `/app/exams/add/page-c574ef79afe303fe.js` | `exam_records`, `exam_sessions`, `exam_subjects` | Exam entry page. |
| `/exams/ai-add` | Confirmed | `AI添加考试成绩` | `/app/exams/ai-add/page-ea69e9653978fb69.js` | `exam_records`, `exam_subjects`; `/api/ai/exam-draft` | AI-assisted exam entry page. |
| `/exams/edit` | Inferred | `编辑考试成绩` | Route string only | Not directly opened; HTML 404 on direct visit | Exists in bundle, but direct page fetch returned 404. |
| `/exams/subjects` | Confirmed | `科目管理` | `/app/exams/subjects/page-1643b8fb31078e7d.js` | `exam_subjects` | Subject management page. |
| `/weakness` | Confirmed | `薄弱知识` / `错题分析` | `/app/weakness/page-eac7c6decb072d66.js` | `knowledge_points`, `practice_questions`, `practice_submissions`, `question_knowledge_links`, `weakness_reports`; `/api/weakness/reports` | Weakness analysis page. |
| `/weakness/add` | Confirmed | `提交练习记录` | `/app/weakness/add/page-0e0b02ba19e1fdc8.js` | `exam_subjects`, `knowledge_points`, `practice_questions`, `practice_submissions`, `question_knowledge_links`; `/api/ai/practice-draft` | Practice upload / analysis entry flow. |
| `/habits/manage` | Confirmed | `管理行为习惯` | `/app/habits/manage/page-cfbeeea90ea81b44.js` | `behavior_habits` | Habit management page. |
| `/habits/checkin` | Confirmed | `行为习惯打卡` | `/app/habits/checkin/page-7da7c92e14c58b21.js` | No obvious direct table/API strings in chunk | Check-in page exists and is routed. |
| `/membership` | Confirmed | `会员中心` / `会员管理` | `/app/membership/page-a950b35337f29c58.js` | `membership_types`, `plan_tasks`, `redemption_records`, `user_achievements`; `get_user_membership`, `redeem_code` | Membership status and upgrade page. |
| `/redeem` | Confirmed | `兑换会员码` / `兑换码` | `/app/redeem/page-aefa9946c03b229a.js` | `membership_types`, `redemption_records`; `get_user_membership`, `redeem_code` | Redemption code entry page. |
| `/rewards/rules` | Confirmed | `奖励规则设置` | `/app/rewards/rules/page-b89fe330a4978892.js` | No obvious direct table/API strings in chunk | Rewards rules page exists. |
| `/rewards/achievements/manage` | Confirmed | `管理成就` | `/app/rewards/achievements/manage/page-f1d6aaa590281d95.js` | `achievements`, `profiles`, `user_achievements`, `user_preferences` | Achievement management page. |
| `/settings` | Confirmed | `系统设置` | `/app/settings/page-36396c0b90915de7.js` | `user_preferences` | General settings page. |
| `/settings/account-password` | Confirmed | `账号密码修改` | `/app/settings/account-password/page-eb132944b74870ae.js` | No obvious direct table/API strings in chunk | Account password change page. |
| `/users` | Confirmed | `用户管理` / `档案管理` | `/app/users/page-3f4203c74e8de469.js` | Broad table surface including `learning_plans`, `exam_records`, `behavior_habits`, `user_points`, `wishlists`, etc. | User management / admin-style page. |
| `/install-guide` | Confirmed | `安装应用到桌面` / `查看教程` | `/app/install-guide/page-7896af0ae228ea96.js` | No obvious direct table/API strings in chunk | PWA install guidance page. |
| `/export` | Inferred | `数据导出` | Route string only | Not opened directly in this pass | Referenced in layout metadata. Needs browser confirmation. |
| `/import` | Inferred | `数据导入` | Route string only | Not opened directly in this pass | Referenced in layout metadata. Needs browser confirmation. |

## Confirmed Shell And Navigation

- Root route client-side redirects to `/dashboard` when logged in and `/auth` when logged out.
- The authenticated shell exposes category groupings for `学习计划`, `习惯管理`, `待办事项`, `奖励系统`, `考试成绩`, `薄弱知识`, `系统功能`, and `会员相关`.
- Bundle metadata references these visible feature paths: `/plans/add`, `/plans/batch-add`, `/plans/ai-add`, `/plans/edit`, `/plans/manage`, `/habits/manage`, `/habits/checkin`, `/rewards/rules`, `/rewards/achievements/manage`, `/exams/add`, `/exams/ai-add`, `/exams/edit`, `/exams/subjects`, `/weakness`, `/weakness/add`, `/settings`, `/settings/account-password`, `/users`, `/export`, `/import`, `/membership`, `/redeem`.

## Ordered Nav Tree

1. `学习计划`
   - `/dashboard` - `首页` / `今日任务` / `今天的任务` / `专注计时器` (labels inferred from bundle strings)
   - `/plans/manage` - `计划管理`
   - `/plans/add` - `添加学习计划`
   - `/plans/ai-add` - `AI添加计划`
   - `/plans/batch-add` - `批量添加计划`
   - `/plans/edit` - `编辑学习计划` (inferred)
2. `习惯管理`
   - `/habits/manage` - `管理行为习惯`
   - `/habits/checkin` - `行为习惯打卡`
3. `待办事项`
   - No route strings were extracted in this pass. The layout bundle names the category, but the item set needs live browser confirmation.
4. `奖励系统`
   - `/rewards/rules` - `奖励规则设置`
   - `/rewards/achievements/manage` - `管理成就`
5. `考试成绩`
   - `/exams/add` - `添加考试成绩`
   - `/exams/ai-add` - `AI添加考试成绩`
   - `/exams/edit` - `编辑考试成绩` (inferred)
   - `/exams/subjects` - `科目管理`
6. `薄弱知识`
   - `/weakness` - `薄弱知识` / `错题分析`
   - `/weakness/add` - `提交练习记录`
7. `系统功能`
   - `/settings` - `系统设置`
   - `/settings/account-password` - `账号密码修改`
   - `/users` - `用户管理` / `档案管理`
   - `/export` - `数据导出` (inferred)
   - `/import` - `数据导入` (inferred)
   - `/install-guide` - `安装应用到桌面` / `查看教程`
8. `会员相关`
   - `/membership` - `会员中心` / `会员管理`
   - `/redeem` - `兑换会员码` / `兑换码`

## Network Contracts Observed

- Auth bootstrap on `/auth` loads `membership_types` from `https://supabase.ttxue.online/rest/v1/membership_types?select=*&is_active=eq.true&order=sort_order.asc`.
- Supabase browser client points at `https://supabase.ttxue.online`.
- Sign-in uses `supabase.auth.signInWithPassword({ email, password })`.
- Forgot-password flow checks `/api/auth/check-email` before calling `resetPasswordForEmail` with redirect to `/auth/reset-password`.
- Registration can invoke `redeem_code` when a membership code is present.

## Ungated State Gaps

The following states still need live browser parity later because this audit did not fully exercise authenticated UI behavior:

- dropdown and popover open/close states
- modal and drawer stacks
- loading, empty, success, and error states per route
- pagination and sorting behavior
- inline validation and disabled states
- write-action confirmation flows
- mobile breakpoints and install-prompt interactions
- any child-mode / permission-gated visibility variations

## Audit Notes

- Direct HTML fetches returned 404 for `/plans/edit` and `/exams/edit`, but both route strings are present in the compiled bundles. Treat them as inferred routes until the in-app navigation path is verified.
- Static bundle analysis showed substantial reliance on Supabase tables and a few Next.js API endpoints, so the local recreation should preserve a centralized request/auth layer rather than hard-code mock data early.
- The authenticated browser session could not be seeded into Playwright due to tooling safety, so the inventory reflects the reachable structure visible from bundles and unauthenticated inspection rather than a complete logged-in click-through.
