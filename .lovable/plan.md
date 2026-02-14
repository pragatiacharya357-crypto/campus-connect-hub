

# UniBuzz — University Student Communication Hub

## Overview
A private, exclusive communication platform for university students featuring verified onboarding, anonymous posting, topic-based feeds, and real-time campus buzz. Bold, vibrant design with campus energy.

---

## 1. Registration & Onboarding Flow

### Step 1: University Email Verification
- Student enters their official `.edu` university email
- Supabase sends a verification email with a magic link
- Student confirms their email to proceed

### Step 2: ID Card Upload
- Student uploads a photo of their university ID card
- Image stored securely in Supabase Storage (not in the database)
- ID number field entered manually for cross-reference
- ID data stored in hashed/encrypted format for validation only

### Step 3: Profile Setup
- Student creates a unique username and password
- Optional display name
- Anonymous posting preference toggle
- Account created after all steps complete

---

## 2. Login Page
- Username/email + password login
- "Forgot password" flow via email reset
- Redirects to main dashboard on success

---

## 3. Main Dashboard — Tab Navigation

Bottom tab bar with 5 tabs:

### 🏠 Home / Buzz Feed
- Chronological feed of all recent posts across all topics
- Each post shows: content, hashtag badges, vote count, comment count, timestamp
- Anonymous posts show "Anonymous Student" instead of username
- Pull-to-refresh style interaction

### 📂 Sections (Topics)
- Grid or list of topic categories:
  - 🚌 Bus/Transport
  - 🍽️ Mess
  - ☕ Canteen
  - 🎉 Fest/Events
  - 😂 Memes/Fun
  - 📚 Study/Academic
  - 💬 General
- Tapping a section shows filtered posts for that topic only

### ✏️ Create Post
- Full-screen post composer
- Text body input
- Hashtag selector (pick one or more from predefined tags)
- Toggle: "Post anonymously"
- Post automatically distributed to relevant section(s) based on hashtags

### 📢 Official Info
- University-verified announcements only (admin-posted)
- Exam schedules, holidays, important notices
- Distinct visual treatment (official badge/banner)

### 👤 Profile / Settings
- View/edit display name
- Toggle anonymous posting default
- Change password
- Logout
- Data privacy info

---

## 4. Post Interactions

### Voting
- Upvote / Downvote (Agree/Disagree) buttons on every post
- Net vote count displayed
- One vote per user per post

### Comments
- Nested comment thread below each post
- Comments also support anonymous posting
- Sorted by newest or most upvoted

---

## 5. Database Design (Supabase)

### Tables:
- **profiles** — username, display_name, hashed_id_number, anonymous_default, avatar_url, verified status
- **posts** — content, author_id, is_anonymous, created_at
- **post_hashtags** — post_id, hashtag (for multi-tag distribution)
- **votes** — post_id, user_id, vote_type (up/down), unique constraint
- **comments** — post_id, parent_comment_id (for nesting), author_id, content, is_anonymous, created_at
- **announcements** — title, content, created_at, admin_id

### Storage:
- **id-cards** bucket — private, for uploaded ID card photos

### Security:
- Row Level Security on all tables
- Users can only edit/delete their own posts and comments
- One vote per user per post enforced at DB level
- ID card images accessible only to admins

---

## 6. Design Direction
- Bold, vibrant color palette with gradients (purple, orange, teal accents)
- Rounded cards with subtle shadows
- Playful icons and emoji-style category badges
- Large, readable typography
- Animated transitions between tabs
- Mobile-first responsive layout

---

## 7. Capacitor Native Setup
- Configure Capacitor for iOS and Android wrapping
- PWA fallback for web access
- Instructions provided for building native apps locally

