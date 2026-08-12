/* Tabby Alchemist — content.
   This file is pure data: no DOM, no logic. Add elements and recipes here
   without touching game.js.

   Element fields:
     n     display name
     e     emoji
     f     flavor line, shown on discovery and as a grid tooltip
     base  true = available from the start
     tabby true = a real Tabby product (green border in the grid)
     final true = triggers the win screen

   Recipe format: ["inputA", "inputB", "result"] — order of inputs does not matter.
   Keep flavor on office elements dry; keep it warm and straight on real products. */

const ELEMENTS = {
  coffee:{n:"Coffee",e:"☕",base:true,f:"The real infrastructure."},
  employee:{n:"Employee",e:"🧑‍💼",base:true,f:"Badge, laptop, opinions about the coffee."},
  shopper:{n:"Shopper",e:"🛍️",base:true,f:"Cart full, thumb hovering."},
  merchant:{n:"Merchant",e:"🏪",base:true,f:"Wants the sale to actually close."},

  code:{n:"Code",e:"⌨️",f:"Compiles on the third attempt."},
  developer:{n:"Developer",e:"👩‍💻",f:"Headphones on means do not approach."},
  team:{n:"Team",e:"👥",f:"A group chat with a budget."},
  manager:{n:"Manager",e:"💼",f:"Turns meetings into more meetings."},
  office:{n:"Office",e:"🏢",f:"Where the good chairs are."},
  meeting:{n:"Meeting",e:"📆",f:"Could have been an email."},
  email:{n:"Email",e:"✉️",f:"Per my last message."},
  onboarding:{n:"Onboarding",e:"🎒",f:"Day one: eleven passwords."},
  intern:{n:"Intern",e:"🧑‍🎓",f:"Asks the question nobody else dared to."},
  deadline:{n:"Deadline",e:"⏰",f:"Immovable, until it moves."},
  standup:{n:"Standup",e:"🧍",f:"Fifteen minutes. Optimistically."},
  sprint:{n:"Sprint",e:"🏃",f:"Two weeks to do three weeks of work."},
  bug:{n:"Bug",e:"🐛",f:"Cannot reproduce on my machine."},
  hotfix:{n:"Hotfix",e:"🩹",f:"Straight to prod. Fingers crossed."},
  codeReview:{n:"Code Review",e:"🔍",f:"Looks good to me. (Did not read it.)"},
  mergeConflict:{n:"Merge Conflict",e:"💥",f:"Two people were right."},
  jira:{n:"Jira Ticket",e:"🎫",f:"Filed. Groomed. Forgotten. Reopened."},
  slack:{n:"Slack Message",e:"💬",f:"“Quick question” — 40 minutes ago."},
  friday:{n:"Friday",e:"🍺",f:"Two weeks done. Monday is Monday's problem."},
  monday:{n:"Monday",e:"😵‍💫",f:"The weekend was a rumour."},
  okr:{n:"OKR",e:"📌",f:"Seventy percent is a win, apparently."},
  kpi:{n:"KPI",e:"📈",f:"A number everyone now optimises for."},
  roadmap:{n:"Roadmap",e:"🗺️",f:"Accurate for about a week."},
  retro:{n:"Retro",e:"🔄",f:"What went well: we had the retro."},
  achiever:{n:"Achiever",e:"🏅",f:"Hit the number. Asked for the next one."},
  oneOnOne:{n:"1:1",e:"🗣️",f:"“So — how are things?”"},
  performanceReview:{n:"Performance Review",e:"📋",f:"Six months compressed into one form."},
  promotion:{n:"Promotion",e:"🎖️",f:"New title, same laptop."},
  burnout:{n:"Burnout",e:"🥵",f:"The sprint that never ended."},
  vacation:{n:"Vacation",e:"🏝️",f:"Out of office. Reading email anyway."},
  allHands:{n:"All-Hands",e:"📢",f:"Nine hundred people, one unmuted microphone."},
  buzzword:{n:"Buzzword",e:"🗯️",f:"Directionally impactful, going forward."},
  synergy:{n:"Synergy",e:"🔗",f:"Nobody has ever seen one in the wild."},
  pivot:{n:"Pivot",e:"↩️",f:"The roadmap was more of a suggestion."},
  brainstorm:{n:"Brainstorm",e:"💡",f:"Forty sticky notes. One survives."},
  idea:{n:"Idea",e:"🧠",f:"Obvious in hindsight."},
  mvp:{n:"MVP",e:"🧪",f:"Minimum, viable, and shipped anyway."},
  launch:{n:"Launch",e:"🚀",f:"Green light. Hold your breath."},

  // ---- Tabby products (real) ----
  checkout:{n:"Checkout",e:"🧾",f:"The last screen between cart and yes."},
  split4:{n:"Split in 4",e:"4️⃣",tabby:true,f:"One order, four payments, no interest."},
  payLater:{n:"Pay Later",e:"⏳",tabby:true,f:"Buy now, settle up later."},
  instantApproval:{n:"Instant Approval",e:"✅",tabby:true,f:"Seconds to decide, so checkout never stalls."},
  interestFree:{n:"Interest-Free",e:"✨",tabby:true,f:"The price you see is the price you pay."},
  tabbyShop:{n:"Tabby Shop",e:"🛒",tabby:true,f:"Somewhere to discover what to buy next."},
  tabbyCard:{n:"Tabby Card",e:"💠",tabby:true,f:"Tabby, everywhere cards are accepted."},
  tabbyPlus:{n:"Tabby Plus",e:"⭐",tabby:true,f:"Rewards for the shoppers who keep coming back."},
  tabbyCare:{n:"Tabby Care",e:"🧯",tabby:true,f:"Support that picks up when something goes wrong."},
  tabbyApp:{n:"Tabby App",e:"📲",tabby:true,f:"The whole thing, in your pocket."},
  superApp:{n:"Super App",e:"📱",tabby:true,f:"Shopping, payments and rewards under one roof."},

  productOfYear:{n:"Product of the Year",e:"🏆",final:true,f:"Endless standups, somehow, into something people love."},
};

const RAW = [
  // ---- People & dev ----
  ["employee","coffee","code"],
  ["employee","code","developer"],
  ["employee","employee","team"],
  ["employee","team","manager"],
  ["team","merchant","office"],
  ["manager","team","meeting"],
  ["office","employee","email"],
  ["manager","email","onboarding"],
  ["onboarding","coffee","intern"],
  ["meeting","code","deadline"],
  ["meeting","team","standup"],
  ["standup","deadline","sprint"],
  ["code","deadline","bug"],
  ["bug","deadline","hotfix"],
  ["code","developer","codeReview"],
  ["code","code","mergeConflict"],
  ["bug","manager","jira"],
  ["meeting","email","slack"],
  ["sprint","deadline","friday"],
  ["bug","friday","monday"],
  ["manager","meeting","okr"],
  ["okr","team","kpi"],
  ["okr","sprint","roadmap"],
  ["sprint","monday","retro"],
  ["employee","kpi","achiever"],
  ["manager","employee","oneOnOne"],
  ["oneOnOne","kpi","performanceReview"],
  ["performanceReview","achiever","promotion"],
  ["deadline","hotfix","burnout"],
  ["burnout","employee","vacation"],
  ["office","meeting","allHands"],
  ["meeting","roadmap","buzzword"],
  ["buzzword","team","synergy"],
  ["roadmap","deadline","pivot"],
  ["meeting","coffee","brainstorm"],
  ["brainstorm","developer","idea"],
  ["idea","sprint","mvp"],
  ["mvp","team","launch"],

  // ---- Tabby products ----
  ["shopper","merchant","checkout"],
  ["checkout","shopper","split4"],
  ["split4","merchant","payLater"],
  ["payLater","code","instantApproval"],
  ["payLater","shopper","interestFree"],
  ["interestFree","merchant","tabbyShop"],
  ["payLater","interestFree","tabbyCard"],
  ["tabbyCard","shopper","tabbyPlus"],
  ["shopper","hotfix","tabbyCare"],
  ["tabbyCard","code","tabbyApp"],
  ["tabbyApp","tabbyShop","superApp"],

  // ---- Finale ----
  ["launch","superApp","productOfYear"],
];
