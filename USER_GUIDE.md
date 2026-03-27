# RanchHand User Guide

## Quick Start

### First Time Setup
1. Install the app and open it
2. You'll see the Dashboard with a "Getting Started" guide
3. Start by adding your first animal or crop

## Main Features

### 🏠 Dashboard
Your central hub for farm overview.

**What You'll See:**
- Quick stats (livestock count, crops, pending tasks)
- Financial overview (income, expenses, profit)
- Today's tasks with overdue alerts
- Recent livestock and crops

**Actions:**
- Pull down to refresh all data
- Tap "AI Assistant" button to ask farming questions
- Navigate to other screens using bottom tabs

### 🐓 Livestock Management

#### Adding Animals
1. Go to **Livestock** tab
2. Tap **+ Add Animal** button
3. Select animal type (chicken, goat, cow, other)
4. Fill in details:
   - Breed (optional)
   - Quantity
   - Date acquired
   - Cost (optional)
   - Notes (optional)
5. AI will generate a custom care plan
6. Review and save

#### Logging Egg Collection (Chickens Only)
1. Find your chicken in the livestock list
2. Tap **Log Eggs** button
3. Enter quantity
4. Select quality (excellent, good, fair, poor)
5. Add notes if needed
6. Tap **Log**

#### Managing Livestock
- View all active animals in the list
- Pull down to refresh
- See care plans and tasks created by AI

### 🌱 Crops Management

#### Adding Crops
1. Go to **Crops** tab
2. Tap **+ Add Crop** button
3. Enter crop details:
   - Crop name (e.g., "Tomatoes")
   - Variety (e.g., "Cherry")
   - Location (greenhouse, outdoor, raised-bed)
   - Planting date
   - Expected harvest date (optional)
   - Quantity and unit (optional)
   - Notes (optional)
4. AI will generate a growing plan
5. Review and save

#### Logging Harvests
1. Find your crop in the list (must be "growing" or "harvesting" status)
2. Tap the **basket icon** 🧺
3. Enter harvest quantity
4. Specify unit (lbs, kg, bushels, etc.)
5. Select quality
6. Add notes
7. Tap **Log**

#### Crop Status
Crops automatically have status indicators:
- 🟢 **Planted** - Just planted
- 🟢 **Growing** - In growth phase
- 🟠 **Harvesting** - Ready to harvest
- ⚫ **Harvested** - Completed
- ⚫ **Failed** - Unsuccessful

### ✅ Tasks

#### Viewing Tasks
Tasks are organized by filters:
- **All** - Every task
- **Today** - Due today
- **Upcoming** - Future tasks
- **Overdue** - Past due tasks

#### Creating Manual Tasks
1. Go to **Tasks** tab
2. Tap **+ Add Task** button
3. Fill in:
   - Title (required)
   - Description
   - Category (feeding, watering, cleaning, health, maintenance, harvesting, financial, other)
   - Due date
   - Recurring? (daily, weekly, monthly)
4. Tap **Add**

#### Completing Tasks
- Tap the checkbox next to any task to mark complete
- Completed tasks show with reduced opacity
- Tap again to mark incomplete

#### Deleting Tasks
- Tap the trash icon on any task to delete

#### AI Schedule Generator
1. Go to **Tasks** tab
2. Tap **Generate AI Schedule** button
3. AI analyzes your livestock and crops
4. Generates a personalized weekly schedule
5. Review the schedule in the dialog
6. Use it as a guide for creating tasks

**What's Included:**
- Daily feeding schedules
- Watering routines
- Cleaning tasks
- Health check reminders
- Harvest timing
- Maintenance activities

### 💰 Financial Records

#### Adding Transactions
1. Go to **Records** tab
2. Make sure you're on the **Financial** tab
3. Tap **+ Add Transaction** button
4. Select type:
   - **Income** (sales, grants, etc.)
   - **Expense** (feed, supplies, etc.)
5. Enter amount
6. Write description
7. Choose category:
   - Feed
   - Supplies
   - Equipment
   - Veterinary
   - Sales
   - Other
8. Tap **Add**

#### Viewing Financial Summary
At the top of the Financial tab, you'll see:
- Total Income (green)
- Total Expenses (red)
- Net Profit/Loss

#### Production Logs
1. Switch to **Production** tab
2. View all egg collections and harvests
3. See date, quantity, and quality
4. Organized by most recent first

**Note:** Production logs are created from the Livestock and Crops screens, not directly here.

### 🤖 AI Assistant

#### Opening the Assistant
1. From **Dashboard**, tap **AI Assistant** FAB button
2. Dialog opens with welcome message

#### Using Quick Questions
- Tap any suggested question chip
- AI responds with expert advice

#### Asking Custom Questions
1. Type your question in the input box
2. Tap send button (➤)
3. AI responds with farming guidance

#### Example Questions
- "How often should I feed my chickens?"
- "When is the best time to harvest tomatoes?"
- "What are signs of healthy goats?"
- "How do I prevent pests in my greenhouse?"
- "What's the ideal temperature for seedlings?"

### 📊 Statistics & Insights

#### Dashboard Stats
- **Livestock Count** - Total active animals
- **Active Crops** - Currently growing crops
- **Pending Tasks** - Tasks not yet done
- **Completed Tasks** - Finished tasks

#### Financial Overview
- **Income** - All money received
- **Expenses** - All money spent
- **Profit** - Income minus expenses

#### Task Overview
- **Today's Tasks** - Count of tasks due today
- **Overdue** - Tasks past their due date
- **Completed** - Total finished tasks

## Tips & Best Practices

### Daily Routine
1. Check **Dashboard** for today's tasks
2. Complete feeding/watering tasks
3. Log any egg collections
4. Check crops for harvest readiness
5. Log any harvests
6. Mark tasks complete as you go

### Weekly Routine
1. Generate AI schedule for the week
2. Create recurring tasks for regular activities
3. Review financial records
4. Update crop statuses
5. Plan next week's activities

### Data Organization
- **Use Categories** - Properly categorize tasks and expenses
- **Add Notes** - Document important observations
- **Track Quality** - Rate production quality for trends
- **Update Statuses** - Keep crop statuses current

### Maximizing AI Features
- **Be Specific** - Ask detailed questions to get better answers
- **Provide Context** - Mention your farm size, climate, experience level
- **Review Care Plans** - Check AI-generated care plans when adding animals/crops
- **Use Schedules** - Let AI create your weekly routine

### Financial Tracking
- **Log Everything** - Record all income and expenses
- **Be Consistent** - Enter transactions regularly
- **Use Descriptions** - Write clear transaction descriptions
- **Categorize Correctly** - Helps with later analysis

## Troubleshooting

### Can't See My Data
- Pull down to refresh
- Check internet connection
- Verify Firebase configuration

### AI Not Responding
- Check Gemini API key in `.env`
- Verify internet connection
- Check API quota in Google AI Studio

### App Crashes
- Close and restart app
- Clear app cache
- Reinstall if problems persist

### Tasks Not Showing
- Check filter setting (all/today/upcoming/overdue)
- Verify tasks have due dates
- Pull down to refresh

## Keyboard Shortcuts

### Navigation
- Swipe left/right between tabs (mobile)
- Use bottom navigation bar

### Quick Actions
- Pull down to refresh any list
- Swipe on items for delete (some screens)

## Data Management

### Backup
Your data is stored in Firebase Firestore and automatically backed up.

### Export
Currently, data export is not available but can be added.

### Privacy
- Data stored securely in Firebase
- Only you have access (when auth is enabled)
- No data sharing with third parties

## Getting Help

### In-App Help
- Use the AI Assistant for farming questions
- Check "Getting Started" on Dashboard

### Common Questions
**Q: How do I track multiple chicken breeds?**
A: Add each breed as a separate entry with its own quantity.

**Q: Can I edit a task after creating it?**
A: Currently, you can only delete and recreate. Editing feature coming soon.

**Q: How do I track milk production?**
A: Use the production logging feature (being expanded to all animal types).

**Q: Can I set reminders?**
A: Task reminders are on the roadmap. For now, check "Today's Tasks" daily.

## Feature Requests

Have an idea for a new feature? We'd love to hear it! Common requests:
- Photo upload for animals/crops
- Weather integration
- Advanced reporting
- Multi-farm support
- Offline mode

---

**Happy Farming! 🚜**

Need more help? Check SETUP_GUIDE.md or README.md
