export const site = {
  name: "Daily Dose of Tech",
  tagline: "Your Tech Learning Hub",
  homeTitle: "Daily Dose of Tech: Your Tech Learning Hub",
  heroKicker: "Empower Your Tech Journey",
  homeLead:
    "Explore the latest in PC parts and tech tricks. Daily Dose of Tech helps you enhance your tech knowledge and skills, making technology accessible and enjoyable for everyone.",
  learnMoreTitle: "Learn More",
  learnMoreBody:
    "Our projects focus on providing comprehensive guides and resources for tech enthusiasts. From detailed daily tips to expand your tech knowledge, to teaching you how to build your first very own personal computer.",
  tipsTitle: "Daily Tech Tips",
  tipsIntro:
    "Daily Tech Tips is your go-to blog for quick and practical IT insights, computer tricks, and tech solutions. From troubleshooting hacks to productivity boosters, we share bite-sized tips to simplify your digital life.",
  tipsSupport:
    "Discover daily tech tips, articles, and insights to improve your tech skills. Our blog offers a range of informative content, designed to keep you updated with the latest technology trends and practices.",
  pcTitle: "PC Building",
  pcIntro:
    "Build your first PC with confidence! Follow our step-by-step guide and start your journey into custom PC building today.",
  pcDreamTitle: "Build Your Dream Gaming PC",
  pcDreamBody:
    "Explore our comprehensive guides on building gaming computers, featuring modern designs, expert tips, and stunning visuals to enhance your gaming experience.",
  insightsTitle: "Tech Insights / Learning Hub",
  insightsIntro:
    "Explore the latest in technology with our curated content on PC parts and essential tricks for computer users. Join us in enhancing your tech knowledge daily.",
  insightsSupport:
    "Explore daily tech tips and tricks that enhance your understanding of technology and improve your skills in the IT field for personal and professional growth.",
  guidesTitle: "Daily Guides",
  guidesLine: "Ranging From Software to Hardware & MUCH MORE!",
  aboutTitle: "About",
  aboutKicker: "Daily Tech Tips for IT Enthusiasts and Learners",
  aboutLead:
    "Empowering you with IT knowledge and PC building insights for everyday success.",
  aboutTipsTitle: "Daily Tech Tips",
  aboutTipsBody:
    "Discover insightful tech tips delivered daily in a blog format, designed to enhance your understanding of technology and keep you updated on the latest trends.",
  comingSoon: "Content is coming.",
} as const

export type PageId = "home" | "tips" | "pc" | "insights" | "about"

export type NavItem = {
  id: PageId
  label: string
  path: string
}

export const navItems: readonly NavItem[] = [
  { id: "home", label: "Home", path: "/" },
  { id: "tips", label: "Daily Tech Tips", path: "/daily-tech-tips/" },
  { id: "pc", label: "PC Building", path: "/pc-building/" },
  {
    id: "insights",
    label: "Tech Insights / Learning Hub",
    path: "/insights/",
  },
  { id: "about", label: "About", path: "/about/" },
]

export type FeatureCard = {
  title: string
  summary: string
  path: string
  page: PageId
}

export const heroFeatures: readonly FeatureCard[] = [
  {
    title: "Daily Tech Tips",
    summary:
      "Stay ahead in tech with our daily tech tips! Whether you're an IT pro or a casual PC user, we share quick, practical insights to boost your skills and enhance your computer experience.",
    path: "/daily-tech-tips/",
    page: "tips",
  },
  {
    title: "PC Building",
    summary:
      "Build your first PC with confidence! Follow our step-by-step guide and start your journey into custom PC building today.",
    path: "/pc-building/",
    page: "pc",
  },
  {
    title: "Tech Insights / Learning Hub",
    summary:
      "Explore the latest in technology with our curated content on PC parts and essential tricks for computer users. Join us in enhancing your tech knowledge daily.",
    path: "/insights/",
    page: "insights",
  },
]
