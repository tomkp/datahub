# User Stories

## Implementation Status

### ✅ Completed
- [x] Drag and Drop Upload
- [x] Select Files via Dialog
- [x] Upload Multiple File Types
- [x] View Upload Progress
- [x] View Upload Queue
- [x] Receive Invalid File Feedback
- [x] View Breadcrumb Trail
- [x] Download File
- [x] Copy File Link
- [x] Paginate Version History (20 per page)
- [x] Filter by Status (file type)
- [x] Filter by Date Range
- [x] Combine Multiple Filters
- [x] Persist Filters in URL
- [x] Clear All Filters
- [x] View Empty Filter Results
- [x] Receive Success Notifications
- [x] Receive Error Notifications
- [x] Navigate with Keyboard (FileTree)
- [x] Use with Screen Reader (ARIA labels)

### 🔲 Remaining

**Quick wins:**
- [ ] View Query Errors - Error handling when data fails to load
- [ ] View File Type Badges - Dataset kind badges on files
- [ ] View Status Badges - Color-coded status badges
- [ ] View Page Title - Show folder name in browser title

**Medium complexity:**
- [ ] View File Details Panel - Side panel with file metadata
- [ ] Close File Details - Close the panel
- [ ] Navigate Between Versions - Keyboard arrows in version history
- [ ] View What's New Panel
- [ ] See Unread Changes Badge

**Higher complexity:**
- [ ] View Tenants
- [ ] Auto-Select Default Tenant
- [ ] View Pipeline Progress
- [ ] View Pipeline Step Status
- [ ] View Pipeline Step Timestamps
- [ ] View Pipeline Step Details
- [ ] Understand Pipeline Failures
- [ ] View PII Scan Results
- [ ] View PII Occurrence Samples
- [ ] Expand PII Type Details
- [ ] Review PII Findings
- [ ] Add Review Comments
- [ ] View PII Unsupported Status

---

## Tenant & Data Room Navigation

**View Tenants**
As a user, I want to see all tenants I have access to so that I can select which organization's data rooms to work with.

**Auto-Select Default Tenant**
As a user, I want to be automatically redirected to my first available tenant so that I can start working immediately without extra navigation.

**View Data Rooms**
As a user, I want to see all data rooms within a tenant displayed as cards with name and description so that I can easily identify and select the one I need.

**Enter Data Room**
As a user, I want to click on a data room card to navigate into it so that I can browse its contents.

---

## File Explorer & Navigation

**Browse Folders**
As a user, I want to navigate through a hierarchical folder structure so that I can locate specific files or folders.

**View Breadcrumb Trail**
As a user, I want to see a breadcrumb trail showing my current location so that I know where I am and can navigate back to parent folders.

**View Files and Folders Table**
As a user, I want to see files and folders in a table showing name, upload date, uploader, and status so that I can understand the contents at a glance.

**View Page Title**
As a user, I want to see the current folder name in the page title so that I know which directory I'm viewing.

---

## File Upload

**Drag and Drop Upload**
As a user, I want to drag and drop files onto the file explorer so that I can quickly upload files without navigating through dialogs.

**Select Files via Dialog**
As a user, I want to click an upload button and select files from a dialog so that I can upload files using a traditional interface.

**Upload Multiple File Types**
As a user, I want to upload CSV, TSV, Excel (.xls, .xlsx, .xlsm, .xlsb), and text files so that I can work with various data formats.

**View Upload Progress**
As a user, I want to see real-time upload progress for each file so that I know how long until my uploads complete.

**View Upload Queue**
As a user, I want to see a queue of pending uploads so that I understand which files are waiting to be uploaded.

**Receive Invalid File Feedback**
As a user, I want to see clear error messages when I try to upload unsupported file types or files exceeding 500MB so that I understand what went wrong.

---

## Folder Management

**Create New Folder**
As a user, I want to create new folders within a data room so that I can organize files into a logical structure.

**Name Folder**
As a user, I want to enter a name when creating a folder so that I can identify it later.

---

## File Details & Operations

**View File Details**
As a user, I want to click on a file to see its details in a side panel showing name, type, status, size, uploader, date, and version count so that I can understand the file's metadata.

**Download File**
As a user, I want to download a file to my computer so that I can work with it locally.

**Copy File Link**
As a user, I want to copy a shareable link to a specific file so that I can share it with colleagues who have access.

**Close File Details**
As a user, I want to close the file details panel so that I can return to browsing the file list.

---

## File Version History

**View Version History**
As a user, I want to see all versions of a file in a timeline view so that I can understand how the file has changed over time.

**Navigate Between Versions**
As a user, I want to navigate between versions using the timeline or keyboard arrows so that I can quickly compare different versions.

**View Version Details**
As a user, I want to see details for each version including status, size, upload date, uploader, and pipeline status so that I can understand the state of each version.

**Paginate Version History**
As a user, I want to paginate through version history (20 per page) so that I can view complete history for files with many versions.

---

## Pipeline Processing & Status

**View Pipeline Progress**
As a user, I want to see a visual step-by-step display of pipeline processing so that I understand where my file is in the processing workflow.

**View Pipeline Step Status**
As a user, I want to see the status of each pipeline step (Pending, In Progress, Completed, Failed) so that I know which steps have finished and which are remaining.

**View Pipeline Step Timestamps**
As a user, I want to see when each pipeline step started and completed so that I can track processing time.

**View Pipeline Step Details**
As a user, I want to expand pipeline steps to see detailed results and messages so that I can understand what happened during processing.

**Understand Pipeline Failures**
As a user, I want to see clear error messages when a pipeline step fails so that I understand why my file wasn't processed successfully.

---

## PII Scanning & Review

**View PII Scan Results**
As a user, I want to see detected PII types with confidence scores and occurrence counts so that I understand what sensitive data was found.

**View PII Occurrence Samples**
As a user, I want to see sample occurrences of each PII type (up to 10 per type) so that I can verify what was detected.

**Expand PII Type Details**
As a user, I want to expand each PII type in an accordion to see all occurrences and their locations so that I can investigate specific findings.

**Review PII Findings**
As a user, I want to approve or reject files flagged for PII review so that files can proceed through the pipeline or be blocked appropriately.

**Add Review Comments**
As a user, I want to add comments explaining my PII review decision so that there's a record of why I approved or rejected the file.

**View PII Unsupported Status**
As a user, I want to see when a file format doesn't support PII scanning so that I understand why PII results aren't available.

---

## Filtering & Search

**Filter by Status**
As a user, I want to filter files by status using checkboxes so that I can focus on files in a particular state.

**Filter by Date Range**
As a user, I want to filter files by upload date range so that I can find files from a specific time period.

**Combine Multiple Filters**
As a user, I want to apply multiple filters simultaneously so that I can narrow down results precisely.

**Persist Filters in URL**
As a user, I want filters to be saved in the URL so that I can bookmark or share filtered views.

**Clear All Filters**
As a user, I want to clear all filters with one click so that I can quickly return to viewing all items.

**View Empty Filter Results**
As a user, I want to see a helpful empty state with a reset button when filters return no results so that I can easily adjust my search.

---

## Notifications & Feedback

**Receive Success Notifications**
As a user, I want to see toast notifications when actions succeed (uploads complete, file downloaded, link copied) so that I have confirmation my actions worked.

**Receive Error Notifications**
As a user, I want to see toast notifications when actions fail so that I know something went wrong and can try again.

**View What's New**
As a user, I want to access a "What's New" panel showing recent changes to the application so that I can stay informed about new features.

**See Unread Changes Badge**
As a user, I want to see a badge indicating unread changes so that I know when there's new information to review.

---

## Visual Indicators & UI

**View File Type Badges**
As a user, I want to see dataset kind badges on files so that I can quickly identify file types visually.

**View Status Badges**
As a user, I want to see color-coded status badges so that I can quickly understand file and pipeline states.

---

## Accessibility

**Navigate with Keyboard**
As a user, I want to navigate the application using only my keyboard so that I can use the application without a mouse.

**Use with Screen Reader**
As a user with a screen reader, I want all interactive elements to have proper ARIA labels so that I can understand and use the application.

---

## Error Handling

**View Query Errors**
As a user, I want to see clear error messages when data fails to load so that I understand what went wrong.
