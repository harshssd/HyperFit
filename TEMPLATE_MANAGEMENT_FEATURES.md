# Template Management Features

## Overview
Comprehensive template organization system for managing workout templates with support for thousands of templates, folders, favorites, tags, and search functionality.

## Database Schema

### Tables Created
1. **workout_templates** - Stores all workout templates
   - Supports user-created, standard, and public templates
   - Includes folder organization, tags, and metadata
   - Tracks usage statistics

2. **workout_template_folders** - Organizes templates into folders
   - User-specific folders with custom colors and icons
   - Supports nested folders (via parent_folder_id)

3. **user_template_favorites** - Many-to-many relationship for favorites
   - Allows users to favorite any template (their own or public)

## Features

### 1. Save Templates
- **Location**: Workout Overview screen
- **Button**: "SAVE TEMPLATE" button in the overview actions
- **Functionality**:
  - Save current workout as a template
  - Add template name (required)
  - Assign to folder (optional)
  - Add tags (optional)
  - Templates are saved to Supabase with user attribution

### 2. Template Organization

#### Folders
- Create custom folders to organize templates
- Each folder has:
  - Custom name
  - Color (for visual organization)
  - Icon (emoji support)
- Templates can be assigned to folders or left unorganized
- Filter templates by folder in the template picker

#### Favorites
- Mark any template as favorite with heart icon
- Quick access via "FAVORITES" filter
- Favorites are user-specific and persist across sessions

#### Tags
- Add multiple tags to templates
- Tags are automatically extracted from all templates
- Filter templates by one or more tags
- Tags help with cross-category organization

### 3. Template Picker Enhancements

#### Search
- Real-time search across:
  - Template names
  - Descriptions
  - Creator usernames
  - Exercise names
- Search bar with clear button

#### Filters
- **Favorites**: Show only favorited templates
- **Folders**: Filter by specific folder or "No Folder"
- **Tags**: Multi-select tag filtering
- Filters can be combined for precise results

#### Template Display
- Shows template metadata:
  - Standard badge (for built-in templates)
  - Creator username (for user-created templates)
  - Folder badge (if assigned)
  - Tags (up to 2 visible, with "+N" indicator)
- Favorite button on each template card
- Exercise count in description

### 4. Template Types

#### Standard Templates
- Built-in templates (Push Day, Pull Day, Leg Day, Core)
- Marked with "STANDARD" badge
- Available to all users
- Cannot be modified by users

#### User-Created Templates
- Created by users from their workouts
- Prefixed with creator's username
- Can be organized into folders
- Can be tagged
- Can be favorited by other users (if made public)

#### Public Templates
- User templates marked as public
- Available to all users
- Can be favorited and used by anyone

## Usage Workflow

### Saving a Template
1. Load a template or create a custom workout
2. Add/modify exercises as needed
3. Click "SAVE TEMPLATE" in workout overview
4. Enter template name
5. (Optional) Select folder
6. (Optional) Add tags
7. Click "SAVE"

### Finding Templates
1. Open template picker
2. Use search bar to find by name/exercise
3. Use filters:
   - Click "FAVORITES" to show only favorites
   - Click "FOLDERS" to filter by folder
   - Click tags to filter by tag
4. Combine filters for precise results

### Organizing Templates
1. Create folders via "NEW" button in folder selector
2. Assign templates to folders when saving
3. Use tags for cross-folder categorization
4. Mark frequently used templates as favorites

## Database Migration

Run the main Supabase migration (`supabase-migration.sql`) in your Supabase SQL Editor to create these tables and policies. If you only need the template schema, `supabase-templates-migration.sql` contains just that subset.

## Technical Details

### Template Storage
- Templates stored in Supabase `workout_templates` table
- Exercises stored as JSONB array
- Supports thousands of templates with efficient querying
- Indexed for fast search and filtering

### Performance
- Templates loaded on-demand when picker opens
- Filtering happens client-side for instant results
- Favorites cached in state for quick access
- GIN index on tags for fast tag-based queries

### Security
- Row Level Security (RLS) policies ensure:
  - Users can only modify their own templates
  - Public templates are readable by all
  - Standard templates are readable by all
  - Folders are user-specific

## Future Enhancements
- Template sharing between users
- Template ratings and reviews
- Template duplication
- Template editing
- Template deletion
- Bulk operations
- Template import/export
- Template versioning
